import { Download } from 'lucide-react'
import { useApp } from '../store'
import { Button, Card, Empty, PageHeader } from '../ui'
import { formatPHP } from '../lib'

export default function Reports() {
  const { ws, toast } = useApp()
  const totalRecorded = ws.orders.reduce((sum, item) => sum + item.amount, 0)
  const stats = [
    ['Saved customers', ws.customers.length],
    ['Queue entries', ws.queue.length],
    ['Appointments', ws.appts.length],
    ['Work records', ws.orders.length],
    ['Recorded work value', formatPHP(totalRecorded)],
  ] as const
  const hasRecords = ws.customers.length + ws.queue.length + ws.appts.length + ws.orders.length > 0
  return <>
    <PageHeader title="Summaries" sub="A summary of the information you have recorded.">
      <Button disabled={!hasRecords} onClick={() => toast('Export is a prototype action and is not connected yet')}><Download size={16} />Export</Button>
    </PageHeader>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{stats.map(([label, value]) => <Card key={label} className="px-4 py-4"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></Card>)}</div>
    {!hasRecords && <Card className="mt-6"><Empty text="Your summaries will appear here after you start adding records." /></Card>}
    {hasRecords && <Card className="mt-6 p-5"><h2 className="font-semibold">Current records</h2><p className="mt-1 text-sm text-muted">These totals reflect the information currently saved in this notebook.</p><div className="mt-4 divide-y divide-line text-sm">{[['Customers', ws.customers.length], ['Queue entries', ws.queue.length], ['Appointments', ws.appts.length], ['Work records', ws.orders.length]].map(([label, value]) => <div key={label} className="flex justify-between py-2.5"><span>{label}</span><b>{value}</b></div>)}</div></Card>}
  </>
}
