export const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const todayISO = () => iso(new Date())
export const fmtTime = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
}
export const nowLabel = () => {
  const d = new Date()
  return fmtTime(`${d.getHours()}:${d.getMinutes()}`)
}
export const fmtDate = (s: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) =>
  parse(s).toLocaleDateString('en-PH', opts)
export const formatPHP = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Math.ceil(amount))
export const initials = (n: string) =>
  n.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()
export const uid = () => Math.random().toString(36).slice(2, 9)
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')
