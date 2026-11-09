import { useState } from 'react'
import { Plus, Trash2, UserRound } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Button, Card, Empty, Field, Modal, PageHeader, field } from '../ui'
import { uid } from '../lib'
import type { Employee } from '../data'

export default function Workers() {
  const { ws, update, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('Staff')
  const [phone, setPhone] = useState('')
  const save = () => {
    if (!name.trim()) return
    const worker: Employee = { id: uid(), name: name.trim(), role: role.trim() || 'Staff', phone: phone.trim(), away: false }
    update(w => ({ ...w, employees: [...w.employees, worker] }))
    toast('Worker added'); setName(''); setRole('Staff'); setPhone(''); setOpen(false)
  }
  const remove = (id: string) => { update(w => ({ ...w, employees: w.employees.filter(e => e.id !== id) })); toast('Worker removed') }
  return <>
    <PageHeader title="Workers" sub="Keep a simple list of the people working at this store."><Button variant="primary" onClick={() => setOpen(true)}><Plus size={16}/>Add worker</Button></PageHeader>
    <Card>
      {ws.employees.length ? <div className="divide-y divide-line">{ws.employees.map(worker => <div key={worker.id} className="flex items-center gap-3 px-5 py-4"><Avatar name={worker.name}/><div className="min-w-0 flex-1"><p className="text-sm font-medium">{worker.name}</p><p className="text-xs text-muted">{worker.role}{worker.phone ? ` · ${worker.phone}` : ''}</p></div><button aria-label={`Remove ${worker.name}`} onClick={() => remove(worker.id)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div>)}</div> : <Empty text="No workers added yet. Add the people who help at this store."/>}
    </Card>
    <p className="mt-3 text-xs text-muted">Workers are listed for reference only. They do not have accounts or separate access to QueueFlow.</p>
    {open && <Modal title="Add worker" onClose={() => setOpen(false)} footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={save} disabled={!name.trim()}>Add worker</Button></>}>
      <Field label="Worker name"><input autoFocus className={field} value={name} onChange={e=>setName(e.target.value)} placeholder="Enter worker name"/></Field>
      <Field label="Role or position"><input className={field} value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Staff, Barber, Cashier"/></Field>
      <Field label="Contact number (optional)"><input className={field} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter contact number"/></Field>
    </Modal>}
  </>
}
