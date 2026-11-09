import { useState } from 'react'
import { Mail, Phone, Plus, Search } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Badge, Button, Card, Empty, Field, Modal, PageHeader, Td, Th, field } from '../ui'
import { fmtDate, uid, todayISO } from '../lib'
import type { Customer } from '../data'

const seg = (c: Customer) => (c.visits >= 10 ? 'VIP' : c.visits <= 1 ? 'New' : 'Regular')

export default function Customers() {
  const { ws, update, toast } = useApp()
  const [q, setQ] = useState('')
  const [f, setF] = useState('All')
  const [sel, setSel] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const t = q.trim().toLowerCase()
  const rows = ws.customers.filter((c) => (f === 'All' || seg(c) === f) && (!t || [c.name, c.phone, c.email].some((v) => v.toLowerCase().includes(t))))
  const cur = ws.customers.find((c) => c.id === sel)
  const [note, setNote] = useState('')

  const save = () => {
    if (!form.name.trim()) return
    const c: Customer = { id: uid(), ...form, name: form.name.trim(), visits: 0, since: todayISO(), history: [] }
    update((w) => ({ ...w, customers: [c, ...w.customers] }), { text: `${c.name} added to customer database`, kind: 'system' })
    toast(`${c.name} added`); setAdding(false); setForm({ name: '', phone: '', email: '', notes: '' })
  }
  const saveNote = () => {
    update((w) => ({ ...w, customers: w.customers.map((c) => (c.id === sel ? { ...c, notes: note } : c)) }))
    toast('Customer notes saved')
  }

  return (
    <>
      <PageHeader title="Customers" sub={`${ws.customers.length} customers in your database.`}>
        <Button variant="primary" onClick={() => setAdding(true)}><Plus size={16} />Add Customer</Button>
      </PageHeader>
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-60 flex-1"><Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" /><input className={field + ' pl-9'} placeholder="Search by name, phone, or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="flex gap-1.5">{['All', 'VIP', 'Regular', 'New'].map((s) => <button key={s} onClick={() => setF(s)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${f === s ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted hover:text-ink'}`}>{s}</button>)}</div>
        </div>
        <ul className="md:hidden">
          {rows.map((c) => (
            <li key={c.id} onClick={() => { setSel(c.id); setNote(c.notes) }} className="flex cursor-pointer items-center gap-3 border-b border-line/60 px-4 py-3">
              <Avatar name={c.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{c.name}</p><p className="truncate text-xs text-muted">{c.phone}</p></div>
              <Badge tone={seg(c) === 'VIP' ? 'In Service' : seg(c) === 'New' ? 'Called' : 'Skipped'}>{seg(c)}</Badge>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-line bg-slate-50/60"><tr><Th>Customer</Th><Th>Contact number</Th><Th>Email</Th><Th>Visits</Th><Th>Segment</Th></tr></thead>
            <tbody>{rows.map((c) => (
              <tr key={c.id} onClick={() => { setSel(c.id); setNote(c.notes) }} className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-slate-50">
                <Td><div className="flex items-center gap-2.5"><Avatar name={c.name} /><span className="font-medium">{c.name}</span></div></Td>
                <Td>{c.phone}</Td><Td className="text-muted">{c.email}</Td><Td>{c.visits}</Td>
                <Td><Badge tone={seg(c) === 'VIP' ? 'In Service' : seg(c) === 'New' ? 'Called' : 'Skipped'}>{seg(c)}</Badge></Td>
              </tr>))}</tbody>
          </table>
        </div>
        {!rows.length && <Empty text="No customers match your search." />}
      </Card>

      {cur && (
        <Modal wide title="Customer profile" onClose={() => setSel(null)} footer={<Button variant="primary" onClick={saveNote}>Save notes</Button>}>
          <div className="mb-5 flex items-center gap-4"><Avatar name={cur.name} size={12} />
            <div><p className="text-lg font-semibold">{cur.name} <span className="ml-1 align-middle"><Badge tone="Skipped">{seg(cur)}</Badge></span></p>
              <p className="flex flex-wrap gap-x-4 text-sm text-muted"><span className="flex items-center gap-1"><Phone size={13} />{cur.phone}</span><span className="flex items-center gap-1"><Mail size={13} />{cur.email}</span></p></div></div>
          <div className="grid gap-5 md:grid-cols-2">
            <div><h3 className="mb-2 text-sm font-semibold">Customer history</h3>
              <ul className="space-y-2.5">{[...ws.appts.filter((a) => a.name === cur.name).map((a) => ({ date: a.date, type: 'Appointment', desc: `${a.service} (${a.status})` })), ...ws.orders.filter((o) => o.customer === cur.name).map((o) => ({ date: o.due, type: 'Request', desc: `${o.code} - ${o.item}` })), ...cur.history].map((h, i) => (
                <li key={i} className="rounded-lg border border-line p-2.5"><div className="flex justify-between text-xs"><b className="text-teal">{h.type}</b><span className="text-muted">{fmtDate(h.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div><p className="mt-0.5 text-sm">{h.desc}</p></li>))}
                {!cur.history.length && <li className="text-sm text-muted">No history yet.</li>}</ul></div>
            <div><Field label="Customer notes"><textarea rows={6} className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Preferences, allergies, reminders..." /></Field>
              <p className="text-xs text-muted">Customer since {fmtDate(cur.since, { month: 'long', year: 'numeric' })} - {cur.visits} total visits</p></div>
          </div>
        </Modal>
      )}
      {adding && (
        <Modal title="Add Customer" onClose={() => setAdding(false)} footer={<><Button onClick={() => setAdding(false)}>Cancel</Button><Button variant="primary" disabled={!form.name.trim()} onClick={save}>Save Customer</Button></>}>
          <Field label="Full name"><input autoFocus className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Contact number"><input className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Notes"><textarea rows={2} className={field} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  )
}
