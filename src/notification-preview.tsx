import { MessageSquareText, PhoneCall } from 'lucide-react'
import { Button, Card, Modal } from './ui'
import type { CustomerRecord } from './data'

export default function NotificationPreview({ record, onClose }: { record: CustomerRecord; onClose: () => void }) {
  const ready = record.workStatus === 'Ready'
  const amount = typeof record.price === 'number' ? ` Amount due: ₱${record.price.toFixed(2)}.` : ''
  const message = ready ? 'is ready for pickup' : 'has been completed and received'
  const sms = `Hello ${record.name}, your ${record.service || 'requested service'} ${message}. Thank you for choosing us.${ready ? ' Please visit us to collect it.' : ''}${amount}`
  const call = `Automated call example: “Hello ${record.name}. Your ${record.service || 'requested service'} ${message}. Thank you for choosing us.”`
  return <Modal title={ready ? 'Ready-for-pickup notification preview' : 'Completion notification preview'} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Close preview</Button>}>
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">DEMO ONLY · No actual phone call or SMS will be sent.</div>
    <div className="space-y-3">
      <Card className="p-3"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><PhoneCall size={16} className="text-teal"/>Automated call example</div><p className="text-sm leading-relaxed text-slate-600">{call}</p><p className="mt-2 text-xs text-muted">To: {record.phone || 'No phone number provided'}</p></Card>
      <Card className="p-3"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><MessageSquareText size={16} className="text-teal"/>SMS message example</div><p className="text-sm leading-relaxed text-slate-600">{sms}</p><p className="mt-2 text-xs text-muted">To: {record.phone || 'No phone number provided'}</p></Card>
    </div>
  </Modal>
}
