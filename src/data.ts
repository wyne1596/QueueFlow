export type QStatus = 'Waiting' | 'Called' | 'In Service' | 'Completed' | 'Skipped' | 'Cancelled'
export type ApptStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled'
export interface Employee { id: string; name: string; role: string; away: boolean; phone: string }
export interface Service { id: string; name: string; duration: number; price: number }
export interface QueueItem { id: string; no: string; name: string; service: string; joined: string; wait: number; employee: string; status: QStatus }
export interface Appt { id: string; name: string; phone: string; service: string; date: string; time: string; employee: string; status: ApptStatus; notes: string }
export interface Order { id: string; code: string; customer: string; item: string; stage: string; due: string; amount: number }
export interface HistoryItem { date: string; type: string; desc: string }
export interface Customer { id: string; name: string; phone: string; email: string; notes: string; history: HistoryItem[]; visits: number; since: string }
export type WorkStatus = 'Not Started' | 'In Progress' | 'Ready' | 'Received' | 'Cancelled'
export type ArrivalStatus = 'Not Arrived' | 'Waiting' | 'Being Served' | 'Departed'
export type RecordSource = 'Walk-in' | 'In person' | 'Phone call' | 'In-person reservation' | 'Other'
export type EntryType = 'Walk-in' | 'Scheduled'
export interface CustomerRecord { id: string; name: string; phone: string; service: string; date: string; time: string; source: RecordSource; entryType?: EntryType; notes: string; workStatus: WorkStatus; arrivalStatus: ArrivalStatus; price?: number; queueOrder?: number; assignedWorker?: string }
export interface NotebookNote { id: string; title: string; body: string; createdAt: string }
export interface PaymentRecord { id: string; recordId: string; customerName: string; amount: number; method: 'Cash' | 'GCash' | 'Bank Transfer'; date: string; note?: string }
export interface CashCount { date: string; actualCash: number; note?: string }
export interface Activity { id: number; text: string; kind: 'queue' | 'appt' | 'order' | 'system'; time: string }
export interface Hours { day: string; open: boolean; from: string; to: string }
export interface Info { name: string; category: string; phone: string; email: string; address: string; tagline: string }
export type Modules = Record<'queue' | 'appointments' | 'orders' | 'reports', boolean>
export interface WS {
  id: string; prefix: string; info: Info; modules: Modules; services: Service[]; employees: Employee[]
  queue: QueueItem[]; appts: Appt[]; orders: Order[]; customers: Customer[]; workflow: string[]
  activity: Activity[]; hours: Hours[]; records: CustomerRecord[]; notes: NotebookNote[]; payments: PaymentRecord[]; cashCounts: CashCount[]
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function buildWorkspace(): WS {
  return {
    id: 'workspace', prefix: 'Q',
    info: { name: '', category: '', phone: '', email: '', address: '', tagline: '' },
    modules: { queue: true, appointments: true, orders: true, reports: false },
    services: [], employees: [], queue: [], appts: [], orders: [], customers: [],
    workflow: ['Pending', 'In Progress', 'Completed'],
    activity: [], records: [], notes: [], payments: [], cashCounts: [],
    hours: days.map((day) => ({ day, open: false, from: '', to: '' })),
  }
}

export const WS_LIST = [{ id: 'workspace', name: 'My Business', category: 'Your workspace' }]
