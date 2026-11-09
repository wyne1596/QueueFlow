import type { QueueItem, WS } from './data'
import { nowLabel } from './lib'

const patch = (w: WS, id: string, p: Partial<QueueItem>): WS => ({ ...w, queue: w.queue.map((q) => (q.id === id ? { ...q, ...p } : q)) })

export const freeEmployee = (w: WS) => {
  const busy = new Set(w.queue.filter((q) => q.status === 'In Service' || q.status === 'Called').map((q) => q.employee))
  return w.employees.find((e) => !e.away && !busy.has(e.name))?.name ?? w.employees.find((e) => !e.away)?.name ?? ''
}
export const nextWaiting = (w: WS) => w.queue.find((q) => q.status === 'Waiting')
export const callNext = (w: WS): WS => {
  const n = nextWaiting(w)
  return n ? patch(w, n.id, { status: 'Called', employee: n.employee || freeEmployee(w) }) : w
}
export const setStatus = (w: WS, id: string, status: QueueItem['status']): WS => {
  const q = w.queue.find((x) => x.id === id)
  return patch(w, id, { status, employee: q?.employee || (status === 'In Service' ? freeEmployee(w) : '') })
}
export const addToQueue = (w: WS, name: string, service: string, employee = ''): { w: WS; item: QueueItem } => {
  const max = Math.max(100, ...w.queue.map((q) => Number(q.no.split('-')[1])))
  const item: QueueItem = { id: 'q' + Date.now() + Math.floor(Math.random() * 99), no: `${w.prefix}-${max + 1}`, name, service, joined: nowLabel(), wait: 0, employee, status: 'Waiting' }
  return { w: { ...w, queue: [...w.queue, item] }, item }
}
export const avgWait = (w: WS) => {
  const l = w.queue.filter((q) => q.status !== 'Cancelled' && q.status !== 'Skipped')
  return l.length ? Math.round(l.reduce((a, q) => a + q.wait, 0) / l.length) : 0
}
