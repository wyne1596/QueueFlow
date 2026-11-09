import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildWorkspace, type Activity, type WS } from './data'

export type Page = 'dashboard' | 'records' | 'money' | 'settings' | 'queue' | 'workers' | 'appointments' | 'orders' | 'customers' | 'reports'
interface Ctx {
  wsId: string; setWsId: (id: string) => void; ws: WS; stores: WS[]; addStore: (name: string) => void
  update: (fn: (w: WS) => WS, log?: { text: string; kind: Activity['kind'] }) => void
  page: Page; setPage: (p: Page) => void; toast: (msg: string) => void
  toasts: { id: number; msg: string }[]
}
const C = createContext<Ctx>(null as never)
export const useApp = () => useContext(C)

export function AppProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<WS[]>([buildWorkspace()])
  const [wsId, setWsIdState] = useState('workspace')
  const [page, setPage] = useState<Page>('dashboard')
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([])
  const seq = useRef(1)
  const ws = stores.find((s) => s.id === wsId) ?? stores[0]
  const toast = useCallback((msg: string) => {
    const id = seq.current++
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])
  const update: Ctx['update'] = useCallback((fn, log) => setStores((current) => current.map((w) => {
    if (w.id !== wsId) return w
    const next = fn(w)
    return log ? { ...next, activity: [{ id: Date.now(), text: log.text, kind: log.kind, time: 'Just now' }, ...next.activity].slice(0, 30) } : next
  })), [wsId])
  const setWsId = useCallback((id: string) => { setWsIdState(id); setPage('dashboard') }, [])
  const addStore = useCallback((name: string) => {
    const id = `store-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const next = { ...buildWorkspace(), id, info: { ...buildWorkspace().info, name: name.trim() } }
    setStores((current) => [...current, next])
    setWsIdState(id)
    setPage('dashboard')
  }, [])
  const value = useMemo(() => ({ wsId, setWsId, ws, stores, addStore, update, page, setPage, toast, toasts }), [wsId, setWsId, ws, stores, addStore, update, page, toast, toasts])
  return <C.Provider value={value}>{children}</C.Provider>
}
