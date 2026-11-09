import { useState } from 'react'
import { Button, Field, Modal, field } from './ui'
import { useApp } from './store'
import { todayISO, uid } from './lib'
import type { CustomerRecord, RecordSource, EntryType, WorkStatus, ArrivalStatus } from './data'

export default function RecordModal({ onClose }: { onClose: () => void }) {
  const { ws, update, toast } = useApp()
  const [form, setForm] = useState({ name: '', phone: '', service: '', date: todayISO(), time: '', source: 'In person' as RecordSource, entryType: 'Walk-in' as EntryType, notes: '', price: '', workStatus: 'Not Started' as WorkStatus, arrivalStatus: 'Waiting' as ArrivalStatus, assignedWorker: '' })
  const [error, setError] = useState(false)
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const save = () => {
    if (!form.name.trim()) { setError(true); return }
    const nextQueueOrder = ws.records.reduce((max, r) => Math.max(max, r.queueOrder ?? 0), 0) + 1
    const isWalkIn = form.entryType === 'Walk-in'
    const scheduledToday = !isWalkIn && form.date === todayISO()
    const arrivalStatus = isWalkIn || scheduledToday ? 'Waiting' : 'Not Arrived'
    const record: CustomerRecord = { ...form, id: uid(), name: form.name.trim(), phone: form.phone.trim(), service: form.service.trim(), notes: form.notes.trim(), price: form.price.trim() === '' ? undefined : Number(form.price), assignedWorker: form.assignedWorker || undefined, arrivalStatus, ...(arrivalStatus === 'Waiting' ? { queueOrder: nextQueueOrder } : {}) }
    update((w) => ({ ...w, records: [record, ...w.records] }), { text: `Record added for ${record.name}`, kind: 'system' })
    toast(`Record saved for ${record.name}`)
    onClose()
  }
  return <Modal title="New customer record" onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save record</Button></>}>
    <Field label="Customer name"><input autoFocus className={field} value={form.name} onChange={(e) => { set('name', e.target.value); setError(false) }} placeholder="Enter customer name" />{error && <span className="mt-1 block text-xs text-red-600">Customer name is required.</span>}</Field>
    <Field label="Contact number"><input className={field} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Enter phone number" /></Field>
    <Field label="Service, product, or purpose"><input className={field} value={form.service} onChange={(e) => set('service', e.target.value)} placeholder="e.g. custom cake, clothing alteration, haircut" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Date"><input type="date" className={field} value={form.date} onChange={(e) => set('date', e.target.value)} /></Field><Field label="Time"><input type="time" className={field} value={form.time} onChange={(e) => set('time', e.target.value)} /></Field></div>
    <Field label="Amount to pay (optional)"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₱</span><input type="number" min="0" step="0.01" className={field + ' pl-7'} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" /></div></Field>
    <Field label="Customer type"><select className={field} value={form.entryType} onChange={(e) => set('entryType', e.target.value)}><option>Walk-in</option><option>Scheduled</option></select></Field>
    <Field label="How was the request received?"><select className={field} value={form.source} onChange={(e) => set('source', e.target.value)}><option>In person</option><option>Phone call</option><option>In-person reservation</option><option>Other</option></select></Field>
    <Field label="Assigned worker (optional)"><select className={field} value={form.assignedWorker} onChange={(e) => set('assignedWorker', e.target.value)}><option value="">Not assigned</option>{ws.employees.map(worker => <option key={worker.id} value={worker.name}>{worker.name}</option>)}</select></Field>
    <Field label="Work status"><select className={field} value={form.workStatus} onChange={(e) => set('workStatus', e.target.value)}><option>Not Started</option><option>In Progress</option><option>Ready</option><option>Received</option><option>Cancelled</option></select></Field>
    <p className="-mt-2 mb-3 text-xs text-muted">Walk-ins enter the queue immediately and do not receive reminders. Scheduled customers can receive call/SMS reminders before their date and are added to the queue on their scheduled date.</p>
    <Field label="Additional notes (optional)"><textarea rows={2} className={field} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Other important details" /></Field>
  </Modal>
}
