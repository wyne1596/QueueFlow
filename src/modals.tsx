import { useState } from 'react'
import { addToQueue } from './ops'
import { Button, Field, Modal, field } from './ui'
import { useApp } from './store'
import { fmtDate, fmtTime, todayISO, uid } from './lib'
import type { Appt, Order } from './data'

export function AddQueueModal({ onClose }: { onClose: () => void }) {
  const { ws, update, toast } = useApp()
  const [name, setName] = useState('')
  const [service, setService] = useState(ws.services[0]?.name ?? '')
  const [employee, setEmployee] = useState('')
  const [err, setErr] = useState(false)
  const save = () => {
    if (!name.trim()) return setErr(true)
    let no = ''
    update((w) => { const r = addToQueue(w, name.trim(), service, employee); no = r.item.no; return r.w }, { text: `${name.trim()} joined the queue`, kind: 'queue' })
    toast(`${name.trim()} added to the queue`)
    onClose()
  }
  return (
    <Modal title="Add Customer to Queue" onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Add to Queue</Button></>}>
      <Field label="Customer name"><input autoFocus className={field} value={name} onChange={(e) => { setName(e.target.value); setErr(false) }} placeholder="Enter customer name" />{err && <span className="mt-1 block text-xs text-red-600">Please enter a name.</span>}</Field>
      <Field label="Requested service"><select className={field} value={service} onChange={(e) => setService(e.target.value)}><option value="">No service selected</option>{ws.services.map((s) => <option key={s.id}>{s.name}</option>)}</select></Field>
      <Field label="Preferred employee (optional)"><select className={field} value={employee} onChange={(e) => setEmployee(e.target.value)}><option value="">Any available</option>{ws.employees.map((s) => <option key={s.id}>{s.name}</option>)}</select></Field>
    </Modal>
  )
}

export function ApptModal({ onClose, date }: { onClose: () => void; date?: string }) {
  const { ws, update, toast } = useApp()
  const [f, setF] = useState({ name: '', phone: '', service: ws.services[0]?.name ?? '', date: date ?? todayISO(), time: '10:00', employee: ws.employees[0]?.name ?? '', notes: '' })
  const [err, setErr] = useState(false)
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))
  const save = () => {
    if (!f.name.trim()) return setErr(true)
    const a: Appt = { id: uid(), ...f, name: f.name.trim(), status: 'Confirmed' }
    update((w) => ({ ...w, appts: [...w.appts, a] }), { text: `New appointment booked by ${a.name} for ${fmtDate(a.date)} ${fmtTime(a.time)}`, kind: 'appt' })
    toast(`Appointment saved for ${a.name}`)
    onClose()
  }
  return (
    <Modal title="Add Appointment" onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save Appointment</Button></>}>
      <Field label="Customer name"><input autoFocus className={field} value={f.name} onChange={(e) => { set('name', e.target.value); setErr(false) }} />{err && <span className="mt-1 block text-xs text-red-600">Customer name is required.</span>}</Field>
      <Field label="Contact number"><input className={field} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63 9XX-XXX-XXXX" /></Field>
      <Field label="Service"><select className={field} value={f.service} onChange={(e) => set('service', e.target.value)}><option value="">No service selected</option>{ws.services.map((s) => <option key={s.id}>{s.name}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className={field} value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Time"><input type="time" className={field} value={f.time} onChange={(e) => set('time', e.target.value)} /></Field>
      </div>
      <Field label="Assigned employee"><select className={field} value={f.employee} onChange={(e) => set('employee', e.target.value)}><option value="">Unassigned</option>{ws.employees.map((s) => <option key={s.id}>{s.name}</option>)}</select></Field>
      <Field label="Notes"><textarea rows={2} className={field} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
    </Modal>
  )
}

export function OrderModal({ onClose }: { onClose: () => void }) {
  const { ws, update, toast } = useApp()
  const [f, setF] = useState({ customer: '', item: '', amount: '', due: todayISO() })
  const [err, setErr] = useState(false)
  const save = () => {
    if (!f.customer.trim() || !f.item.trim()) return setErr(true)
    const o: Order = { id: uid(), code: `ORD-${1000 + Math.floor(Math.random() * 900)}`, customer: f.customer.trim(), item: f.item.trim(), stage: ws.workflow[0], due: f.due, amount: Number(f.amount) || 0 }
    update((w) => ({ ...w, orders: [o, ...w.orders] }), { text: `New request ${o.code} created for ${o.customer}`, kind: 'order' })
    toast(`Request ${o.code} created`)
    onClose()
  }
  return (
    <Modal title="New Order / Request" onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Create Request</Button></>}>
      <Field label="Customer name"><input autoFocus className={field} value={f.customer} onChange={(e) => { setF({ ...f, customer: e.target.value }); setErr(false) }} /></Field>
      <Field label="Item / description"><input className={field} value={f.item} onChange={(e) => { setF({ ...f, item: e.target.value }); setErr(false) }} placeholder="Describe the request" /></Field>
      {err && <p className="mb-3 text-xs text-red-600">Customer and item are required.</p>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₱)"><input type="number" min="0" className={field} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Due date"><input type="date" className={field} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
      </div>
      <p className="text-xs text-muted">New requests start at the first workflow step: <b>{ws.workflow[0]}</b>.</p>
    </Modal>
  )
}
