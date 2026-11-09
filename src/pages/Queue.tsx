import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Play, Plus, SkipForward, UserRoundCheck } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Badge, Button, Card, Empty, PageHeader, Tabs } from '../ui'
import RecordModal from '../record-modal'
import NotificationPreview from '../notification-preview'
import type { CustomerRecord, ArrivalStatus, WorkStatus } from '../data'
import { cx, todayISO } from '../lib'

type Filter = 'Active' | 'Waiting' | 'Closed' | 'All'
export default function Queue() {
  const { ws, update, toast } = useApp()
  const [add, setAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('Active')
  const [completedRecord, setCompletedRecord] = useState<CustomerRecord | null>(null)
  // Scheduled customers automatically become queue-eligible on their scheduled date.
  useEffect(() => {
    const due = ws.records.filter((r) => (r.entryType ?? (r.source === 'Walk-in' ? 'Walk-in' : 'Scheduled')) === 'Scheduled' && r.date === todayISO() && r.arrivalStatus === 'Not Arrived' && !['Received', 'Cancelled'].includes(r.workStatus)).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    if (!due.length) return
    update((w) => {
      let nextOrder = w.records.reduce((max, r) => Math.max(max, r.queueOrder ?? 0), 0)
      const dueIds = new Set(due.map((r) => r.id))
      return { ...w, records: w.records.map((r) => dueIds.has(r.id) ? { ...r, arrivalStatus: 'Waiting' as const, queueOrder: ++nextOrder } : r) }
    }, { text: `${due.length} scheduled customer(s) added to today's queue`, kind: 'queue' })
  }, [ws.records, update])
  const queue = useMemo(() => ws.records.filter((r) => r.arrivalStatus === 'Waiting' || r.arrivalStatus === 'Being Served').sort((a, b) => (a.queueOrder ?? Number.MAX_SAFE_INTEGER) - (b.queueOrder ?? Number.MAX_SAFE_INTEGER)), [ws.records])
  const waiting = queue.filter((r) => r.arrivalStatus === 'Waiting')
  const serving = queue.filter((r) => r.arrivalStatus === 'Being Served')
  const selected = queue.find((r) => r.id === selectedId) ?? null
  const rows = filter === 'All' ? ws.records : filter === 'Waiting' ? ws.records.filter((r) => r.arrivalStatus === 'Waiting') : filter === 'Closed' ? ws.records.filter((r) => ['Departed'].includes(r.arrivalStatus) || ['Received', 'Cancelled'].includes(r.workStatus)) : queue
  const orderedRows = [...rows].sort((a, b) => {
    const activeA = a.arrivalStatus === 'Waiting' || a.arrivalStatus === 'Being Served'
    const activeB = b.arrivalStatus === 'Waiting' || b.arrivalStatus === 'Being Served'
    if (activeA && activeB) return (a.queueOrder ?? Number.MAX_SAFE_INTEGER) - (b.queueOrder ?? Number.MAX_SAFE_INTEGER)
    if (activeA !== activeB) return activeA ? -1 : 1
    return (a.date + a.time).localeCompare(b.date + b.time)
  })
  const position = (id: string) => waiting.findIndex((r) => r.id === id) + 1
  const setStatuses = (record: CustomerRecord, arrivalStatus: ArrivalStatus, workStatus?: WorkStatus) => {
    const nextWork = workStatus ?? record.workStatus
    const updated = { ...record, arrivalStatus, workStatus: nextWork }
    update((w) => ({ ...w, records: w.records.map((r) => r.id === record.id ? updated : r) }), { text: `${record.name}: ${arrivalStatus}${workStatus ? ` / ${workStatus}` : ''}`, kind: 'queue' })
    toast(`${record.name}: ${arrivalStatus}`)
    if ((record.entryType ?? (record.source === 'Walk-in' ? 'Walk-in' : 'Scheduled')) === 'Scheduled' && nextWork === 'Received' && record.workStatus !== 'Received') setCompletedRecord(updated)
  }
  const callNext = () => {
    const next = waiting[0]
    if (!next) return
    setStatuses(next, 'Being Served', next.workStatus === 'Not Started' ? 'In Progress' : undefined)
    setSelectedId(next.id)
  }
  return <>
    <PageHeader title="Queue Management" sub="Manage customers who have arrived and are waiting for service.">
      <Button onClick={() => setAdd(true)}><Plus size={16}/>Add customer</Button>
      <Button variant="primary" disabled={!waiting.length} onClick={callNext}><UserRoundCheck size={16}/>Serve next</Button>
    </PageHeader>
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[['Waiting', waiting.length], ['Being served', serving.length], ['Ready for pickup', ws.records.filter((r) => r.workStatus === 'Ready').length], ['Not arrived', ws.records.filter((r) => r.arrivalStatus === 'Not Arrived' && r.workStatus !== 'Received' && r.workStatus !== 'Cancelled').length]].map(([label, value]) => <Card key={label} className="px-4 py-3"><p className="text-xs text-muted">{label}</p><p className="text-2xl font-semibold">{value}</p></Card>)}
    </div>
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3"><div><h2 className="text-sm font-semibold">Customer queue</h2><p className="mt-0.5 text-xs text-muted">Only customers marked Waiting or Being Served appear in the active queue.</p></div><Tabs value={filter} onChange={setFilter} items={[{ id: 'Active', label: 'Active' }, { id: 'Waiting', label: 'Waiting' }, { id: 'Closed', label: 'Closed' }, { id: 'All', label: 'All', count: ws.records.length }]}/></div>
      {orderedRows.length ? <div className="divide-y divide-line">{orderedRows.map((r) => <div key={r.id} onClick={() => setSelectedId(r.id)} className={cx('flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 sm:px-5', selectedId === r.id && 'bg-teal-50/60')}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-navy">{r.arrivalStatus === 'Waiting' ? `#${position(r.id)}` : r.arrivalStatus === 'Being Served' ? '→' : '—'}</div><Avatar name={r.name}/>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="truncate text-xs text-muted">{r.service || 'Service not specified'}{r.assignedWorker ? ` · ${r.assignedWorker}` : ''} · {r.source}</p><div className="mt-1 flex flex-wrap gap-1.5"><Badge>{r.arrivalStatus}</Badge><Badge>{r.workStatus}</Badge></div></div>
        {typeof r.price === 'number' && <span className="text-sm font-medium">₱{r.price.toFixed(2)}</span>}
        {r.arrivalStatus === 'Waiting' && r.workStatus === 'Ready' && <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); setStatuses(r, 'Departed', 'Received') }}><CheckCircle2 size={13}/>Mark received</Button>}
        {r.arrivalStatus === 'Waiting' && r.workStatus !== 'Ready' && <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); setStatuses(r, 'Being Served', r.workStatus === 'Not Started' ? 'In Progress' : undefined) }}><Play size={13}/>Serve</Button>}
        {r.arrivalStatus === 'Being Served' && <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); setStatuses(r, 'Departed', 'Received') }}><CheckCircle2 size={13}/>Mark received</Button>}
        {r.arrivalStatus === 'Waiting' && <Button size="sm" onClick={(e) => { e.stopPropagation(); setStatuses(r, 'Departed') }}><SkipForward size={13}/>Skip</Button>}
      </div>)}</div> : <Empty text={filter === 'Waiting' ? 'No customers are waiting.' : 'No customer records in this view.'}/>}
      {selected && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-slate-50 px-4 py-3 text-sm"><span className="text-muted">Selected: <b className="text-ink">{selected.name}</b> · {selected.arrivalStatus} · {selected.workStatus}</span><div className="flex gap-2">{selected.arrivalStatus === 'Waiting' && selected.workStatus === 'Ready' && <Button size="sm" variant="primary" onClick={() => setStatuses(selected, 'Departed', 'Received')}><CheckCircle2 size={13}/>Mark received</Button>}{selected.arrivalStatus === 'Waiting' && selected.workStatus !== 'Ready' && <Button size="sm" variant="primary" onClick={() => setStatuses(selected, 'Being Served', selected.workStatus === 'Not Started' ? 'In Progress' : undefined)}><Play size={13}/>Start service</Button>}{selected.arrivalStatus === 'Being Served' && <Button size="sm" variant="primary" onClick={() => setStatuses(selected, 'Departed', 'Received')}><CheckCircle2 size={13}/>Mark received</Button>}</div></div>}
    </Card>
    <p className="mt-3 text-xs text-muted">Walk-ins enter the queue immediately and do not receive call/SMS reminders. Scheduled customers can be prepared in advance and are automatically added to today's queue on their scheduled date.</p>
    {add && <RecordModal onClose={() => setAdd(false)}/>}
    {completedRecord && <NotificationPreview record={completedRecord} onClose={() => setCompletedRecord(null)}/>}
  </>
}
