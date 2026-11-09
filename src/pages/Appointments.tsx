import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Badge, Button, Card, Empty, Modal, PageHeader, Tabs } from '../ui'
import { ApptModal } from '../modals'
import { addDays, cx, fmtDate, fmtTime, iso, parse, todayISO } from '../lib'
import type { Appt, ApptStatus } from '../data'

const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i)
const hourOf = (t: string) => Number(t.split(':')[0])
const tone: Record<ApptStatus, string> = { Confirmed: 'border-l-teal bg-teal-50', Pending: 'border-l-amber-500 bg-amber-50', Completed: 'border-l-emerald-500 bg-emerald-50', Cancelled: 'border-l-slate-300 bg-slate-100 opacity-60' }

export default function Appointments() {
  const { ws, update, toast } = useApp()
  const [view, setView] = useState<'day' | 'week'>(window.innerWidth < 768 ? 'day' : 'week')
  const [sel, setSel] = useState(todayISO())
  const [add, setAdd] = useState(false)
  const [detail, setDetail] = useState<string | null>(null)
  const [statusF, setStatusF] = useState<'All' | ApptStatus>('All')
  const selD = parse(sel)
  const monthStart = new Date(selD.getFullYear(), selD.getMonth(), 1)
  const gridStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7))
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const weekStart = addDays(selD, -((selD.getDay() + 6) % 7))
  const days = view === 'day' ? [selD] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const by = useMemo(() => { const m: Record<string, Appt[]> = {}; ws.appts.forEach((a) => (m[a.date] ??= []).push(a)); return m }, [ws.appts])
  const today = todayISO()
  const list = ws.appts.filter((a) => a.date >= today && (statusF === 'All' || a.status === statusF)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const cur = ws.appts.find((a) => a.id === detail)
  const shift = (n: number) => setSel(iso(addDays(selD, view === 'day' ? n : n * 7)))
  const setStatus = (a: Appt, s: ApptStatus) => {
    update((w) => ({ ...w, appts: w.appts.map((x) => (x.id === a.id ? { ...x, status: s } : x)) }), { text: `Appointment for ${a.name} marked ${s.toLowerCase()}`, kind: 'appt' })
    toast(`Appointment ${s.toLowerCase()}`)
  }

  return (
    <>
      <PageHeader title="Appointments" sub="Record and manage appointments for your customers.">
        <Button variant="primary" onClick={() => setAdd(true)}><Plus size={16} />Add Appointment</Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <b className="text-sm">{selD.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</b>
              <div className="flex gap-1">
                <button aria-label="Previous month" className="rounded p-1 hover:bg-slate-100" onClick={() => setSel(iso(new Date(selD.getFullYear(), selD.getMonth() - 1, 1)))}><ChevronLeft size={16} /></button>
                <button aria-label="Next month" className="rounded p-1 hover:bg-slate-100" onClick={() => setSel(iso(new Date(selD.getFullYear(), selD.getMonth() + 1, 1)))}><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] text-muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="py-1">{d}</span>)}</div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d) => {
                const k = iso(d), n = (by[k] ?? []).filter((a) => a.status !== 'Cancelled').length
                return (
                  <button key={k} onClick={() => setSel(k)} className={cx('relative flex h-9 items-center justify-center rounded-md text-xs transition', k === sel ? 'bg-navy font-semibold text-white' : k === today ? 'bg-teal-50 font-semibold text-teal' : d.getMonth() === selD.getMonth() ? 'hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50')}>
                    {d.getDate()}
                    {n > 0 && <span className={cx('absolute bottom-1 size-1 rounded-full', k === sel ? 'bg-white' : 'bg-teal')} />}
                  </button>
                )
              })}
            </div>
            <Button size="sm" className="mt-3 w-full" onClick={() => setSel(today)}>Jump to today</Button>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-line px-4 py-3"><b className="text-sm">Upcoming</b>
              <select aria-label="Filter status" value={statusF} onChange={(e) => setStatusF(e.target.value as 'All')} className="rounded-md border border-line bg-white px-2 py-1 text-xs"><option>All</option><option>Confirmed</option><option>Pending</option><option>Completed</option><option>Cancelled</option></select>
            </div>
            <ul className="max-h-[420px] overflow-y-auto">
              {list.map((a) => (
                <li key={a.id}><button onClick={() => { setDetail(a.id); setSel(a.date) }} className="flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-left last:border-0 hover:bg-slate-50">
                  <Avatar name={a.name} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.name}</span><span className="block truncate text-xs text-muted">{fmtDate(a.date)} - {fmtTime(a.time)}</span></span>
                  <Badge>{a.status}</Badge>
                </button></li>
              ))}
              {!list.length && <Empty text="No upcoming appointments." />}
            </ul>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <button aria-label="Previous" className="rounded-lg border border-line p-1.5 hover:bg-slate-50" onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
              <button aria-label="Next" className="rounded-lg border border-line p-1.5 hover:bg-slate-50" onClick={() => shift(1)}><ChevronRight size={16} /></button>
              <b className="ml-1 text-sm">{view === 'day' ? fmtDate(sel, { weekday: 'long', month: 'long', day: 'numeric' }) : `${days[0].toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} - ${days[6].toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`}</b>
            </div>
            <Tabs value={view} onChange={setView} items={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }]} />
          </div>
          <div className="overflow-x-auto">
            <div style={{ minWidth: view === 'week' ? 760 : 0 }}>
              <div className="grid border-b border-line" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
                <span />
                {days.map((d) => (
                  <button key={iso(d)} onClick={() => { setSel(iso(d)); }} className={cx('py-2.5 text-center text-xs', iso(d) === today ? 'font-semibold text-teal' : 'text-muted')}>
                    {d.toLocaleDateString('en-PH', { weekday: 'short' })}<span className={cx('mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm', iso(d) === sel ? 'bg-navy text-white' : 'text-ink')}>{d.getDate()}</span>
                  </button>
                ))}
              </div>
              {HOURS.map((h) => (
                <div key={h} className="grid border-b border-line/60 last:border-0" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
                  <span className="px-2 pt-2 text-right text-[11px] text-muted">{fmtTime(`${h}:00`)}</span>
                  {days.map((d) => {
                    const items = (by[iso(d)] ?? []).filter((a) => hourOf(a.time) === h).sort((a, b) => a.time.localeCompare(b.time))
                    return (
                      <div key={iso(d)} className="min-h-14 space-y-1 border-l border-line/60 p-1">
                        {items.map((a) => (
                          <button key={a.id} onClick={() => setDetail(a.id)} className={cx('block w-full rounded-md border-l-[3px] px-2 py-1 text-left', tone[a.status])}>
                            <span className="block truncate text-xs font-semibold">{a.name}</span>
                            <span className="block truncate text-[11px] text-muted">{fmtTime(a.time)} - {view === 'day' ? `${a.service} - ${a.employee}` : a.service}</span>
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {add && <ApptModal date={sel} onClose={() => setAdd(false)} />}
      {cur && (
        <Modal title="Appointment details" onClose={() => setDetail(null)}
          footer={<>
            {cur.status !== 'Cancelled' && cur.status !== 'Completed' && <Button variant="danger" onClick={() => { setStatus(cur, 'Cancelled'); setDetail(null) }}>Cancel appointment</Button>}
            {cur.status === 'Pending' && <Button variant="primary" onClick={() => setStatus(cur, 'Confirmed')}>Confirm</Button>}
            {cur.status === 'Confirmed' && <Button variant="primary" onClick={() => { setStatus(cur, 'Completed'); setDetail(null) }}>Mark completed</Button>}
          </>}>
          <div className="mb-4 flex items-center gap-3"><Avatar name={cur.name} size={11} /><div><p className="font-semibold">{cur.name}</p><p className="text-sm text-muted">{cur.phone || 'No phone on file'}</p></div><span className="ml-auto"><Badge>{cur.status}</Badge></span></div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[['Service', cur.service], ['Assigned to', cur.employee], ['Date', fmtDate(cur.date, { weekday: 'long', month: 'long', day: 'numeric' })], ['Time', fmtTime(cur.time)]].map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm"><span className="text-xs text-muted">Notes</span><p>{cur.notes || 'No notes.'}</p></div>
        </Modal>
      )}
    </>
  )
}
