import { useState } from 'react'
import { Phone, Plus } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Badge, Button, Card, Field, Modal, PageHeader, field } from '../ui'
import { uid, todayISO } from '../lib'

export default function Employees() {
  const { ws, update, toast } = useApp()
  const [add, setAdd] = useState(false)
  const [f, setF] = useState({ name: '', role: '', phone: '' })
  const save = () => {
    if (!f.name.trim()) return
    update((w) => ({ ...w, employees: [...w.employees, { id: uid(), name: f.name.trim(), role: f.role.trim() || 'Staff', phone: f.phone, away: false }] }), { text: `${f.name.trim()} added to the team`, kind: 'system' })
    toast(`${f.name.trim()} added`); setAdd(false); setF({ name: '', role: '', phone: '' })
  }
  return (
    <>
      <PageHeader title="Employees" sub="Your team, their availability, and today's workload.">
        <Button variant="primary" onClick={() => setAdd(true)}><Plus size={16} />Add Employee</Button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ws.employees.map((e) => {
          const serving = ws.queue.find((q) => q.employee === e.name && q.status === 'In Service')
          const st = e.away ? 'Away' : serving ? 'Busy' : 'Available'
          const todays = ws.appts.filter((a) => a.employee === e.name && a.date === todayISO() && a.status !== 'Cancelled').length
          const done = ws.queue.filter((q) => q.employee === e.name && q.status === 'Completed').length
          return (
            <Card key={e.id} className="p-5">
              <div className="flex items-start gap-3"><Avatar name={e.name} size={11} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{e.name}</p><p className="text-sm text-muted">{e.role}</p></div><Badge>{st}</Badge></div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted"><Phone size={14} />{e.phone || 'No phone'}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[['Appts today', todays], ['Served', done], ['Now', serving ? 1 : 0]].map(([l, v]) => <div key={l} className="rounded-lg bg-slate-50 py-2"><p className="text-lg font-semibold">{v}</p><p className="text-[11px] text-muted">{l}</p></div>)}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => { update((w) => ({ ...w, employees: w.employees.map((x) => (x.id === e.id ? { ...x, away: !x.away } : x)) }), { text: `${e.name} marked ${e.away ? 'available' : 'away'}`, kind: 'system' }); toast(`${e.name} is now ${e.away ? 'available' : 'away'}`) }}>{e.away ? 'Mark available' : 'Mark away'}</Button>
              </div>
            </Card>
          )
        })}
      </div>
      {add && (
        <Modal title="Add Employee" onClose={() => setAdd(false)} footer={<><Button onClick={() => setAdd(false)}>Cancel</Button><Button variant="primary" disabled={!f.name.trim()} onClick={save}>Add Employee</Button></>}>
          <Field label="Full name"><input autoFocus className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Role"><input className={field} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="e.g. Senior Barber" /></Field>
          <Field label="Phone"><input className={field} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  )
}
