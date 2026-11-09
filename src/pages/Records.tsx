import { useMemo, useState } from 'react'
import { CalendarDays, Phone, Plus, Search, Clock, Trash2, MessageSquareText, PhoneCall } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Badge, Button, Card, Empty, Field, Modal, PageHeader, Tabs, field } from '../ui'
import RecordModal from '../record-modal'
import NotificationPreview from '../notification-preview'
import ContactPreview from '../contact-preview'
import type { CustomerRecord, WorkStatus, ArrivalStatus } from '../data'
import { fmtDate, fmtTime, todayISO } from '../lib'

type Filter = 'All' | 'Active' | 'Scheduled' | 'Ready' | 'Closed'
export default function Records() {
  const { ws, update, toast } = useApp()
  const [add, setAdd] = useState(false)
  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CustomerRecord | null>(null)
  const [workDraft, setWorkDraft] = useState<WorkStatus>('Not Started')
  const [arrivalDraft, setArrivalDraft] = useState<ArrivalStatus>('Not Arrived')
  const [completedRecord, setCompletedRecord] = useState<CustomerRecord | null>(null)
  const [contact, setContact] = useState<{ record: CustomerRecord; mode: 'call' | 'sms' } | null>(null)

  const rows = useMemo(() => ws.records.filter((r) => {
    const closed = r.workStatus === 'Received' || r.workStatus === 'Cancelled'
    const active = !closed
    const matches = filter === 'All' || (filter === 'Active' && active) || (filter === 'Scheduled' && r.arrivalStatus === 'Not Arrived' && !closed) || (filter === 'Ready' && r.workStatus === 'Ready') || (filter === 'Closed' && closed)
    const q = query.trim().toLowerCase()
    return matches && (!q || [r.name, r.phone, r.service, r.source].some((v) => v.toLowerCase().includes(q)))
  }).sort((a, b) => {
    const aWaiting = a.arrivalStatus === 'Waiting'
    const bWaiting = b.arrivalStatus === 'Waiting'
    if (aWaiting && bWaiting) return (a.queueOrder ?? Number.MAX_SAFE_INTEGER) - (b.queueOrder ?? Number.MAX_SAFE_INTEGER)
    if (aWaiting !== bWaiting) return aWaiting ? -1 : 1
    return (a.date + a.time).localeCompare(b.date + b.time)
  }), [ws.records, filter, query])

  const openRecord = (record: CustomerRecord) => { setSelected(record); setWorkDraft(record.workStatus); setArrivalDraft(record.arrivalStatus) }
  const changeStatuses = () => {
    if (!selected) return
    const record = selected
    const nextOrder = ws.records.reduce((max, r) => Math.max(max, r.queueOrder ?? 0), 0) + 1
    const updated: CustomerRecord = { ...record, workStatus: workDraft, arrivalStatus: arrivalDraft, ...(arrivalDraft === 'Waiting' && record.arrivalStatus !== 'Waiting' ? { queueOrder: nextOrder } : {}) }
    update((w) => ({ ...w, records: w.records.map((r) => r.id === record.id ? updated : r) }), { text: `${record.name}'s work: ${workDraft}; arrival: ${arrivalDraft}`, kind: 'system' })
    toast(`Updated ${record.name}'s statuses`)
    setSelected(updated)
    if ((record.entryType ?? (record.source === 'Walk-in' ? 'Walk-in' : 'Scheduled')) === 'Scheduled' && ['Ready', 'Received'].includes(workDraft) && record.workStatus !== workDraft) setCompletedRecord(updated)
  }
  const remove = (record: CustomerRecord) => { update((w) => ({ ...w, records: w.records.filter((r) => r.id !== record.id) })); toast('Record deleted'); setSelected(null) }

  return <>
    <PageHeader title="Customer Records" sub="Track customer requests, work progress, and arrivals in one place.">
      <Button variant="primary" onClick={() => setAdd(true)}><Plus size={16}/>New record</Button>
    </PageHeader>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Tabs value={filter} onChange={setFilter} items={[{ id: 'All', label: 'All', count: ws.records.length }, { id: 'Active', label: 'Active' }, { id: 'Scheduled', label: 'Scheduled' }, { id: 'Ready', label: 'Ready' }, { id: 'Closed', label: 'Closed' }]}/>
      <div className="relative w-full sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input className={field + ' pl-9'} placeholder="Search records..." value={query} onChange={(e) => setQuery(e.target.value)}/></div>
    </div>
    <Card>
      {rows.length ? <div className="divide-y divide-line">{rows.map((r) => <button key={r.id} onClick={() => openRecord(r)} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 sm:px-5">
        <Avatar name={r.name}/><div className="min-w-0 flex-1"><p className="font-medium">{r.name}</p><p className="mt-0.5 truncate text-sm text-muted">{r.service || 'No service specified'}{r.assignedWorker ? ` · ${r.assignedWorker}` : ''} · {r.entryType ?? (r.source === 'Walk-in' ? 'Walk-in' : 'Scheduled')} · {r.source}</p><div className="mt-1 flex flex-wrap gap-1.5"><Badge>{r.workStatus}</Badge><Badge>{r.arrivalStatus}</Badge></div><p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">{r.phone && <span className="inline-flex items-center gap-1"><Phone size={12}/>{r.phone}</span>}<span className="inline-flex items-center gap-1"><CalendarDays size={12}/>{r.date ? fmtDate(r.date) : 'No date'}</span>{r.time && <span className="inline-flex items-center gap-1"><Clock size={12}/>{fmtTime(r.time)}</span>}</p></div>{typeof r.price === 'number' && <span className="text-sm font-semibold">₱{r.price.toFixed(2)}</span>}<span className="text-xs text-teal">View</span>
      </button>)}</div> : <Empty text={query ? 'No matching records.' : 'No customer records yet. Add a walk-in, reservation, or phone inquiry to get started.'}/>}</Card>
    {add && <RecordModal onClose={() => setAdd(false)}/>}
    {selected && <Modal title="Customer record" onClose={() => setSelected(null)} footer={<><Button variant="danger" onClick={() => remove(selected)}><Trash2 size={14}/>Delete</Button><Button onClick={() => setSelected(null)}>Close</Button></>}>
      <div className="mb-4 flex items-center gap-3"><Avatar name={selected.name} size={11}/><div><p className="font-semibold">{selected.name}</p><p className="text-xs text-muted">{(selected.entryType ?? (selected.source === 'Walk-in' ? 'Walk-in' : 'Scheduled'))} · {selected.source}</p></div></div>
      <div className="space-y-3 text-sm"><div><p className="text-xs text-muted">Contact number</p><p>{selected.phone || 'Not provided'}</p></div><div><p className="text-xs text-muted">Service, product, or purpose</p><p>{selected.service || 'Not specified'}</p></div><div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-muted">Date</p><p>{selected.date ? fmtDate(selected.date) : 'Not set'}</p></div><div><p className="text-xs text-muted">Time</p><p>{selected.time ? fmtTime(selected.time) : 'Not set'}</p></div></div><div><p className="text-xs text-muted">Assigned worker</p><p>{selected.assignedWorker || 'Not assigned'}</p></div><div><p className="text-xs text-muted">Amount to pay</p><p className="font-semibold">{typeof selected.price === 'number' ? `₱${selected.price.toFixed(2)}` : 'Not specified'}</p></div><div><p className="text-xs text-muted">Additional notes</p><p className="whitespace-pre-wrap">{selected.notes || 'No additional notes'}</p></div></div>
      {(selected.entryType ?? (selected.source === 'Walk-in' ? 'Walk-in' : 'Scheduled')) === 'Scheduled' && selected.date >= todayISO() && !['Received', 'Cancelled'].includes(selected.workStatus) && <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => setContact({ record: selected, mode: 'call' })}><PhoneCall size={13}/>Call reminder</Button><Button size="sm" onClick={() => setContact({ record: selected, mode: 'sms' })}><MessageSquareText size={13}/>SMS reminder</Button></div>}
      <div className="mt-5 rounded-lg border border-line bg-slate-50 p-3"><p className="mb-3 text-sm font-semibold">Update progress</p><div className="grid grid-cols-2 gap-3"><Field label="Work status"><select className={field} value={workDraft} onChange={(e) => setWorkDraft(e.target.value as WorkStatus)}><option>Not Started</option><option>In Progress</option><option>Ready</option><option>Received</option><option>Cancelled</option></select></Field><Field label="Arrival / queue status"><select className={field} value={arrivalDraft} onChange={(e) => setArrivalDraft(e.target.value as ArrivalStatus)}><option>Not Arrived</option><option>Waiting</option><option>Being Served</option><option>Departed</option></select></Field></div><p className="mb-3 text-xs text-muted">Work status tracks the order or service. Arrival status tracks whether the customer is at the shop. Only Waiting customers enter the queue.</p><Button variant="primary" block disabled={workDraft === selected.workStatus && arrivalDraft === selected.arrivalStatus} onClick={changeStatuses}>Save status changes</Button></div>
    </Modal>}
    {completedRecord && <NotificationPreview record={completedRecord} onClose={() => setCompletedRecord(null)}/>}
    {contact && <ContactPreview record={contact.record} mode={contact.mode} onClose={() => setContact(null)}/>}
  </>
}
