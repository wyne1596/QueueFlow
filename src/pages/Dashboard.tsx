import { useState } from 'react'
import { CalendarDays, Clock, Plus, Wallet, Users } from 'lucide-react'
import { useApp } from '../store'
import { Avatar, Badge, Button, Card, Empty, PageHeader } from '../ui'
import RecordModal from '../record-modal'
import { fmtDate, fmtTime, todayISO } from '../lib'
export default function Dashboard(){
  const {ws,setPage}=useApp(); const [add,setAdd]=useState(false); const today=todayISO()
  const active=ws.records.filter(r=>!['Received','Cancelled'].includes(r.workStatus))
  const todayRecords=ws.records.filter(r=>r.date===today&&r.workStatus!=='Cancelled')
  const recent=[...ws.records].slice(0,5)
  const moneyToday=ws.payments.filter(p=>p.date===today).reduce((n,p)=>n+p.amount,0)
  return <>
    <PageHeader title="Dashboard" sub={ws.info.name?`A quick overview of ${ws.info.name}.`:'A quick overview of your business records and daily activity.'}/>
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <button onClick={()=>setPage('records')}><Card className="p-4 text-left"><div className="flex items-center justify-between"><span className="text-sm text-muted">Customer records</span><Users size={17} className="text-teal"/></div><p className="mt-2 text-3xl font-semibold">{ws.records.length}</p><p className="text-xs text-muted">All saved entries</p></Card></button>
      <button onClick={()=>setPage('queue')}><Card className="p-4 text-left"><div className="flex items-center justify-between"><span className="text-sm text-muted">Active records</span><Clock size={17} className="text-teal"/></div><p className="mt-2 text-3xl font-semibold">{active.length}</p><p className="text-xs text-muted">Ongoing or scheduled</p></Card></button>
      <button onClick={()=>setPage('money')}><Card className="p-4 text-left"><div className="flex items-center justify-between"><span className="text-sm text-muted">Money received today</span><Wallet size={17} className="text-teal"/></div><p className="mt-2 text-3xl font-semibold">₱{moneyToday.toFixed(2)}</p><p className="text-xs text-muted">Recorded payments</p></Card></button>
      <button onClick={()=>setPage('workers')}><Card className="p-4 text-left"><div className="flex items-center justify-between"><span className="text-sm text-muted">Workers</span><Users size={17} className="text-teal"/></div><p className="mt-2 text-3xl font-semibold">{ws.employees.length}</p><p className="text-xs text-muted">People at this store</p></Card></button>
    </div>
    <Card className="mt-6 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Customer records</h2><p className="mt-1 text-sm text-muted">Walk-ins, scheduled requests, and phone inquiries are kept together.</p></div><Button variant="primary" onClick={()=>setAdd(true)}><Plus size={16}/>New customer record</Button></div></Card>
    <Card className="mt-6"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-semibold">Today's entries</h2><p className="mt-1 text-xs text-muted">{todayRecords.length} record(s) dated today</p></div><button className="text-sm font-medium text-teal" onClick={()=>setPage('records')}>View all</button></div>{todayRecords.length?<ul className="divide-y divide-line">{todayRecords.map(r=><li key={r.id} className="flex items-center gap-3 px-5 py-3"><Avatar name={r.name}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="truncate text-xs text-muted">{r.service||r.source} {r.time?`· ${fmtTime(r.time)}`:''}</p></div><div className="flex flex-col items-end gap-1"><Badge>{r.workStatus}</Badge><span className="text-[11px] text-muted">{r.arrivalStatus}</span></div></li>)}</ul>:<Empty text="No entries for today."/>}</Card>
    <Card className="mt-6"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div className="flex items-center gap-2"><CalendarDays size={16} className="text-muted"/><h2 className="font-semibold">Recent records</h2></div><button className="text-sm font-medium text-teal" onClick={()=>setPage('records')}>Open records</button></div>{recent.length?<ul className="divide-y divide-line">{recent.map(r=><li key={r.id} className="flex items-center gap-3 px-5 py-3"><Avatar name={r.name}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="truncate text-xs text-muted">{r.source} · {r.date?fmtDate(r.date):'No date'}</p></div><div className="flex flex-col items-end gap-1"><Badge>{r.workStatus}</Badge><span className="text-[11px] text-muted">{r.arrivalStatus}</span></div></li>)}</ul>:<Empty text="Your customer records will appear here."/>}</Card>
    {add&&<RecordModal onClose={()=>setAdd(false)}/>}
  </>
}
