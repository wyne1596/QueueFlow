import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Button, Card, PageHeader } from '../ui'
import { OrderModal } from '../modals'
import { cx, fmtDate, formatPHP, todayISO } from '../lib'

export default function Orders() {
  const { ws, update, toast } = useApp()
  const [add, setAdd] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)
  const steps = ws.workflow
  const last = steps[steps.length - 1]
  const moveTo = (id: string, stage: string) => {
    const o = ws.orders.find((x) => x.id === id)
    if (!o || o.stage === stage) return
    update((w) => ({ ...w, orders: w.orders.map((x) => (x.id === id ? { ...x, stage } : x)) }), { text: `Order ${o.code} moved to ${stage}`, kind: 'order' })
    toast(`${o.code} moved to ${stage}`)
  }
  const total = ws.orders.filter((o) => o.stage !== last).reduce((a, o) => a + o.amount, 0)

  return (
    <>
      <PageHeader title="Work Records" sub="Keep track of customer requests, work status, due dates, and agreed amounts.">
        <Button variant="primary" onClick={() => setAdd(true)}><Plus size={16} />Add Work Record</Button>
      </PageHeader>
      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="px-4 py-3"><p className="text-xs text-muted">Total records</p><p className="text-2xl font-semibold">{ws.orders.length}</p></Card>
        <Card className="px-4 py-3"><p className="text-xs text-muted">Open</p><p className="text-2xl font-semibold">{ws.orders.filter((o) => o.stage !== last).length}</p></Card>
        <Card className="px-4 py-3"><p className="text-xs text-muted">Outstanding work value</p><p className="text-2xl font-semibold">{formatPHP(total)}</p></Card>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {steps.map((s) => {
          const items = ws.orders.filter((o) => o.stage === s)
          const i = steps.indexOf(s)
          return (
            <div key={s} onDragOver={(e) => { e.preventDefault(); setOverCol(s) }} onDragLeave={() => setOverCol(null)} onDrop={() => { if (dragId) moveTo(dragId, s); setDragId(null); setOverCol(null) }}
              className={cx('w-72 shrink-0 rounded-xl border p-3 transition', overCol === s ? 'border-teal bg-teal-50/60' : 'border-line bg-slate-100/60')}>
              <div className="mb-3 flex items-center justify-between px-1"><b className="text-sm">{s}</b><span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted">{items.length}</span></div>
              <div className="space-y-2.5">
                {items.map((o) => (
                  <Card key={o.id} draggable onDragStart={() => setDragId(o.id)} onDragEnd={() => setDragId(null)} className={cx('cursor-grab p-3', dragId === o.id && 'opacity-40')}>
                    <div className="flex items-center justify-between text-xs"><span className="font-semibold text-teal">{o.code}</span><span className={cx(o.due < todayISO() && o.stage !== last ? 'text-red-600' : 'text-muted')}>Due {fmtDate(o.due, { month: 'short', day: 'numeric' })}</span></div>
                    <p className="mt-1.5 text-sm font-medium leading-snug">{o.item}</p>
                    <div className="mt-2.5 flex items-center gap-2"><Avatar name={o.customer} size={6} /><span className="flex-1 truncate text-xs text-muted">{o.customer}</span><span className="text-sm font-semibold">{formatPHP(o.amount)}</span></div>
                    <div className="mt-3 flex gap-1.5 border-t border-line pt-2.5">
                      <Button size="sm" className="flex-1" disabled={i === 0} onClick={() => moveTo(o.id, steps[i - 1])}><ArrowLeft size={13} />Back</Button>
                      <Button size="sm" variant="primary" className="flex-1" disabled={i === steps.length - 1} onClick={() => moveTo(o.id, steps[i + 1])}>Advance<ArrowRight size={13} /></Button>
                    </div>
                  </Card>
                ))}
                {!items.length && <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-muted">No records in this stage</p>}
              </div>
            </div>
          )
        })}
      </div>
      {add && <OrderModal onClose={() => setAdd(false)} />}
    </>
  )
}
