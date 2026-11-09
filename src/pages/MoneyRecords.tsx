import { useMemo, useState } from 'react'
import { ArrowDownLeft, Plus, Wallet, Banknote, CalendarDays } from 'lucide-react'
import { useApp } from '../store'
import { Button, Card, Empty, Field, Modal, PageHeader, field } from '../ui'
import { fmtDate, todayISO, uid } from '../lib'
import type { PaymentRecord } from '../data'

export default function MoneyRecords() {
  const { ws, update, toast } = useApp()
  const [date, setDate] = useState(todayISO())
  const [addOpen, setAddOpen] = useState(false)
  const [cashOpen, setCashOpen] = useState(false)
  const [recordId, setRecordId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentRecord['method']>('Cash')
  const [paymentDate, setPaymentDate] = useState(todayISO())
  const [actualCash, setActualCash] = useState('')
  const [cashNote, setCashNote] = useState('')

  const paymentsToday = useMemo(() => ws.payments.filter(p => p.date === date), [ws.payments, date])
  const received = paymentsToday.reduce((sum, p) => sum + p.amount, 0)
  const cashReceived = paymentsToday.filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0)
  const nonCashReceived = received - cashReceived
  const count = ws.cashCounts.find(c => c.date === date)
  const outstanding = ws.records.reduce((sum, r) => sum + Math.max(0, (r.price ?? 0) - ws.payments.filter(p => p.recordId === r.id).reduce((n, p) => n + p.amount, 0)), 0)
  const payableRecords = ws.records.filter(r => typeof r.price === 'number' && r.price > 0 && (r.price - ws.payments.filter(p => p.recordId === r.id).reduce((n, p) => n + p.amount, 0)) > 0)
  const selectedRecord = ws.records.find(r => r.id === recordId)
  const paidForSelected = selectedRecord ? ws.payments.filter(p => p.recordId === selectedRecord.id).reduce((n, p) => n + p.amount, 0) : 0
  const balance = selectedRecord ? Math.max(0, (selectedRecord.price ?? 0) - paidForSelected) : 0

  const savePayment = () => {
    if (!selectedRecord || !amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > balance || !paymentDate) return
    const payment: PaymentRecord = { id: uid(), recordId, customerName: selectedRecord.name, amount: Number(amount), method, date: paymentDate }
    update(w => ({ ...w, payments: [payment, ...w.payments] }), { text: `Payment of ₱${payment.amount.toFixed(2)} recorded for ${payment.customerName}`, kind: 'system' })
    toast('Payment recorded')
    setAddOpen(false); setRecordId(''); setAmount(''); setMethod('Cash')
  }
  const saveCashCount = () => {
    if (actualCash.trim() === '' || !Number.isFinite(Number(actualCash)) || Number(actualCash) < 0) return
    update(w => ({ ...w, cashCounts: [...w.cashCounts.filter(c => c.date !== date), { date, actualCash: Number(actualCash), note: cashNote.trim() }] }))
    toast('Daily cash count saved'); setCashOpen(false)
  }
  const openCashCount = () => { setActualCash(count ? String(count.actualCash) : ''); setCashNote(count?.note ?? ''); setCashOpen(true) }

  return <>
    <PageHeader title="Money Records" sub="Record customer payments and check your daily cash against the app.">
      <Button variant="primary" onClick={() => setAddOpen(true)}><Plus size={16}/>Record payment</Button>
    </PageHeader>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <Field label="Payment date"><input type="date" className={field} value={date} onChange={e => setDate(e.target.value)}/></Field>
      <Button onClick={openCashCount}><Banknote size={15}/>{count ? 'Update cash count' : 'Enter actual cash'}</Button>
    </div>
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-4"><p className="text-xs text-muted">Money received on {fmtDate(date, {month:'short',day:'numeric'})}</p><p className="mt-2 text-2xl font-semibold">₱{received.toFixed(2)}</p><p className="mt-1 text-xs text-muted">All recorded payment methods</p></Card>
      <Card className="p-4"><p className="text-xs text-muted">Cash received</p><p className="mt-2 text-2xl font-semibold">₱{cashReceived.toFixed(2)}</p><p className="mt-1 text-xs text-muted">Cash payments only</p></Card>
      <Card className="p-4"><p className="text-xs text-muted">Non-cash payments</p><p className="mt-2 text-2xl font-semibold">₱{nonCashReceived.toFixed(2)}</p><p className="mt-1 text-xs text-muted">GCash and bank transfer</p></Card>
      <Card className="p-4"><p className="text-xs text-muted">Outstanding balances</p><p className="mt-2 text-2xl font-semibold">₱{outstanding.toFixed(2)}</p><p className="mt-1 text-xs text-muted">Across customer records</p></Card>
    </div>
    <Card className="mb-5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Daily cash check</h2><p className="mt-1 text-xs text-muted">Compare the cash recorded in QueueFlow with the cash physically counted.</p></div><CalendarDays size={18} className="text-muted"/></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-muted">Recorded cash</p><p className="mt-1 text-lg font-semibold">₱{cashReceived.toFixed(2)}</p></div>
        <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-muted">Actual cash counted</p><p className="mt-1 text-lg font-semibold">{count ? `₱${count.actualCash.toFixed(2)}` : 'Not entered'}</p></div>
        <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-muted">Difference</p><p className="mt-1 text-lg font-semibold">{count ? `${(count.actualCash - cashReceived) < 0 ? '-' : ''}₱${Math.abs(count.actualCash - cashReceived).toFixed(2)}` : '—'}</p>{count && <p className="mt-1 text-xs text-muted">{Math.abs(count.actualCash - cashReceived) < 0.005 ? 'Amounts match' : count.actualCash > cashReceived ? 'Actual cash is higher' : 'Actual cash is lower'}</p>}</div>
      </div>
      {count?.note && <p className="mt-3 text-xs text-muted">Note: {count.note}</p>}
    </Card>
    <Card>
      <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-semibold">Payment history</h2><p className="mt-1 text-xs text-muted">Payments received on {fmtDate(date)}</p></div><span className="text-xs text-muted">{paymentsToday.length} payment(s)</span></div>
      {paymentsToday.length ? <div className="divide-y divide-line">{paymentsToday.map(p => <div key={p.id} className="flex items-center gap-3 px-5 py-3"><span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ArrowDownLeft size={17}/></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{p.customerName}</p><p className="text-xs text-muted">{p.method} · {p.date}</p></div><p className="text-sm font-semibold">₱{p.amount.toFixed(2)}</p></div>)}</div> : <Empty text="No payments recorded for this date."/>}
    </Card>
    {addOpen && <Modal title="Record a payment" onClose={() => setAddOpen(false)} footer={<><Button onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={savePayment} disabled={!selectedRecord || !amount || Number(amount) <= 0 || Number(amount) > balance}>Save payment</Button></>}>
      <Field label="Customer record"><select className={field} value={recordId} onChange={e => {setRecordId(e.target.value);setAmount('')}}><option value="">Select a customer</option>{payableRecords.map(r => <option key={r.id} value={r.id}>{r.name} · {r.service || 'Service'}</option>)}</select></Field>
      {selectedRecord && <div className="mb-3 rounded-lg bg-slate-50 p-3 text-sm"><div className="flex justify-between"><span className="text-muted">Amount to pay</span><b>₱{(selectedRecord.price ?? 0).toFixed(2)}</b></div><div className="mt-1 flex justify-between"><span className="text-muted">Previously paid</span><b>₱{paidForSelected.toFixed(2)}</b></div><div className="mt-1 flex justify-between"><span className="text-muted">Remaining balance</span><b>₱{balance.toFixed(2)}</b></div></div>}
      <Field label="Amount received"><div className="relative"><span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">₱</span><input type="number" min="0.01" max={balance} step="0.01" className={field+' pl-7'} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></div></Field>
      <Field label="Payment method"><select className={field} value={method} onChange={e=>setMethod(e.target.value as PaymentRecord['method'])}><option>Cash</option><option>GCash</option><option>Bank Transfer</option></select></Field>
      <Field label="Date received"><input type="date" className={field} value={paymentDate} onChange={e=>setPaymentDate(e.target.value)}/></Field>
      {!payableRecords.length && <p className="text-xs text-muted">There are no customer records with an outstanding amount. Add an amount to pay to a customer record first.</p>}
    </Modal>}
    {cashOpen && <Modal title="Enter actual cash count" onClose={() => setCashOpen(false)} footer={<><Button onClick={() => setCashOpen(false)}>Cancel</Button><Button variant="primary" onClick={saveCashCount}>Save cash count</Button></>}>
      <p className="mb-3 text-sm text-muted">Count the physical cash received for {fmtDate(date)}. QueueFlow will compare it with cash payments recorded for the same date.</p>
      <Field label="Actual cash counted"><div className="relative"><span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">₱</span><input type="number" min="0" step="0.01" className={field+' pl-7'} value={actualCash} onChange={e=>setActualCash(e.target.value)} placeholder="0.00"/></div></Field>
      <Field label="Note (optional)"><textarea rows={2} className={field} value={cashNote} onChange={e=>setCashNote(e.target.value)} placeholder="Add a note about any difference"/></Field>
    </Modal>}
  </>
}
