import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AppProvider, useApp, type Page } from './store'
import { cx, initials } from './lib'
import { Avatar } from './ui'
import { Bell, Check, LayoutDashboard, Menu, Search, Settings, Users, X, Workflow, ClipboardList, ChevronDown, Plus, Store, Wallet, UserRound } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import Queue from './pages/Queue'
import MoneyRecords from './pages/MoneyRecords'
import Workers from './pages/Workers'
import { Button, Field, Modal, field } from './ui'
import SettingsPage from './pages/SettingsPage'

function BottomNav({ openMenu }: { openMenu: () => void }) {
  const { page, setPage } = useApp()
  const items = NAV.filter((n) => ['dashboard', 'records', 'queue', 'money'].includes(n.id))
  return <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">{items.map((n) => <button key={n.id} onClick={() => setPage(n.id)} className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium', page === n.id ? 'text-teal' : 'text-muted')}><n.icon size={20}/>{n.label}</button>)}<button onClick={openMenu} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted"><Menu size={20}/>More</button></nav>
}

const NAV: { id: Page; label: string; icon: typeof Users }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'records', label: 'Customer Records', icon: ClipboardList },
  { id: 'queue', label: 'Queue Management', icon: Users },
  { id: 'workers', label: 'Workers', icon: UserRound },
  { id: 'money', label: 'Money Records', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function useOutside(close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close()
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  })
  return ref
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const { page, setPage } = useApp()
  const items = NAV
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-navy/40 lg:hidden" onClick={close} />}
      <aside className={cx('fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy text-slate-300 transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center gap-2.5 px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal text-white"><Workflow size={18} /></span>
          <span className="text-lg font-semibold tracking-tight text-white">QueueFlow</span>
          <button className="ml-auto lg:hidden" onClick={close} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {items.map((n) => (
            <button key={n.id} onClick={() => { setPage(n.id); close() }} className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition', page === n.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white')}>
              <n.icon size={18} className={page === n.id ? 'text-teal-300 text-[#4fd1c0]' : ''} />
              {n.label}
            </button>
          ))}
        </nav>

      </aside>
    </>
  )
}


function WorkspaceSelector() {
  const { ws, stores, setWsId, addStore } = useApp()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const ref = useOutside(() => setOpen(false))
  const create = () => { if (!name.trim()) return; addStore(name); setName(''); setAdding(false); setOpen(false) }
  return <>
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-white py-1.5 px-2.5 text-left hover:bg-slate-50">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-semibold text-white">{initials(ws.info.name || 'My Business')}</span>
        <span className="min-w-0"><span className="block max-w-36 truncate text-sm font-semibold leading-tight">{ws.info.name || 'My Business'}</span><span className="block text-xs leading-tight text-muted">My Stores</span></span>
        <ChevronDown size={15} className="shrink-0 text-muted"/>
      </button>
      {open && <div className="pop absolute left-0 z-50 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-xl">
        <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Switch store</p>
        {stores.map((store) => <button key={store.id} onClick={() => { setWsId(store.id); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50">
          <Store size={16} className="text-muted"/><span className="min-w-0 flex-1 truncate">{store.info.name || 'My Business'}</span>{store.id === ws.id && <Check size={15} className="text-teal"/>}
        </button>)}
        <div className="my-1 border-t border-line"/><button onClick={() => setAdding(true)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-teal hover:bg-teal-50"><Plus size={16}/>Add new store</button>
      </div>}
    </div>
    {adding && <Modal title="Add a store" onClose={() => setAdding(false)} footer={<><Button onClick={() => setAdding(false)}>Cancel</Button><Button variant="primary" onClick={create}>Add store</Button></>}><Field label="Store name"><input autoFocus className={field} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Branch"/></Field></Modal>}
  </>
}

function GlobalSearch({ mobile }: { mobile?: boolean }) {
  const { ws, setPage } = useApp()
  const [q, setQ] = useState('')
  const ref = useOutside(() => setQ(''))
  const t = q.trim().toLowerCase()
  const res: { label: string; sub: string; page: Page }[] = t
    ? ws.records.filter((r) => r.name.toLowerCase().includes(t) || r.phone.includes(t) || r.service.toLowerCase().includes(t)).map((r) => ({ label: r.name, sub: `${r.source} · ${r.workStatus} · ${r.arrivalStatus}`, page: 'records' as Page })).slice(0, 8)
    : []
  return (
    <div className={cx('relative max-w-md flex-1', mobile ? 'block' : 'hidden md:block')} ref={ref}>
      <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your records..." className="w-full rounded-lg border border-line bg-canvas py-2 pr-3 pl-9 text-sm outline-none focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/20" />
      {t && (
        <div className="pop absolute top-full z-40 mt-2 w-full rounded-xl border border-line bg-white p-1.5 shadow-xl">
          {res.length ? res.map((r, i) => (
            <button key={i} onClick={() => { setPage(r.page); setQ('') }} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"><span className="font-medium">{r.label}</span><span className="text-xs text-muted">{r.sub}</span></button>
          )) : <p className="px-3 py-3 text-sm text-muted">No results for "{q}"</p>}
        </div>
      )}
    </div>
  )
}

function Notifications() {
  const { ws } = useApp()
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<Record<string, number>>({})
  const ref = useOutside(() => setOpen(false))
  const last = seen[ws.id] ?? 3
  const unread = ws.activity.filter((a) => a.id > last).length
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label="Notifications" className="relative rounded-lg border border-line bg-white p-2 text-muted hover:text-ink">
        <Bell size={18} />
        {unread > 0 && <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="pop absolute right-0 z-40 mt-2 w-80 rounded-xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3"><b className="text-sm">Notifications</b><button className="text-xs font-medium text-teal" onClick={() => setSeen({ ...seen, [ws.id]: Infinity })}>Mark all read</button></div>
          <ul className="max-h-80 overflow-y-auto">
            {ws.activity.slice(0, 7).map((a) => (
              <li key={a.id} className="flex gap-3 border-b border-line/60 px-4 py-3 last:border-0">
                <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', a.id > last ? 'bg-teal' : 'bg-slate-300')} />
                <div><p className="text-sm">{a.text}</p><p className="text-xs text-muted">{a.time}</p></div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Profile() {
  const { setPage } = useApp()
  return <button onClick={() => setPage('settings')} className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 hover:bg-slate-100">
    <Avatar name="Owner" size={8} />
    <span className="hidden text-left lg:block"><span className="block text-sm font-medium leading-tight">Owner</span><span className="block text-xs leading-tight text-muted">Settings</span></span>
  </button>
}

function Shell() {
  const { page, toasts } = useApp()
  const [menu, setMenu] = useState(false)
  const View: Record<Page, () => ReactNode> = {
    dashboard: Dashboard, records: Records, queue: Queue, money: MoneyRecords, workers: Workers, settings: SettingsPage, appointments: Records, orders: Records, customers: Records, reports: Records,
  }
  const Page = View[page] as () => ReactNode
  return (
    <div className="min-h-screen">
      <Sidebar open={menu} close={() => setMenu(false)} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={20} /></button>
          <WorkspaceSelector />
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <Notifications />
            <Profile />
          </div>
        </header>
        <div className="flex px-4 pt-3 md:hidden"><GlobalSearch mobile /></div>
        <main key={page} className="mx-auto max-w-[1280px] p-4 pb-24 sm:p-6 lg:pb-6"><Page /></main>
        <BottomNav openMenu={() => setMenu(true)} />
      </div>
      <div className="fixed right-3 bottom-20 left-3 z-[70] sm:left-auto sm:right-5 sm:bottom-5 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="pop flex items-center gap-2.5 rounded-lg bg-navy px-4 py-3 text-sm text-white shadow-xl"><Check size={16} className="text-[#4fd1c0]" />{t.msg}</div>
        ))}
      </div>
    </div>
  )
}
export default function App() {
  return <AppProvider><Shell /></AppProvider>
}
