import { MessageSquareText, PhoneCall } from 'lucide-react'
import { Button, Card, Modal } from './ui'
import type { CustomerRecord } from './data'

export default function ContactPreview({ record, mode, onClose }: { record: CustomerRecord; mode: 'call' | 'sms'; onClose: () => void }) {
  const date = record.date || 'your scheduled date'
  const time = record.time || ''
  const details = `${date}${time ? ` at ${time}` : ''}`
  const message = mode === 'call'
    ? `Hello ${record.name}. This is a reminder about your ${record.service || 'scheduled service or order'} on ${details}. Please contact us if you need to make changes. Thank you.`
    : `Hello ${record.name}, this is a reminder about your ${record.service || 'scheduled service or order'} on ${details}. Please contact us if you need to make changes. Thank you.`
  return <Modal title={mode === 'call' ? 'Call reminder preview' : 'SMS reminder preview'} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Close preview</Button>}>
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">DEMO ONLY · No actual phone call or SMS will be sent.</div>
    <Card className="p-3"><div className="mb-2 flex items-center gap-2 text-sm font-semibold">{mode === 'call' ? <PhoneCall size={16} className="text-teal"/> : <MessageSquareText size={16} className="text-teal"/>}{mode === 'call' ? 'Automated call script' : 'SMS message'}</div><p className="text-sm leading-relaxed text-slate-600">{message}</p><p className="mt-2 text-xs text-muted">To: {record.phone || 'No phone number provided'}</p></Card>
  </Modal>
}
