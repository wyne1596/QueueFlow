import { useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store'
import { Button, Card, PageHeader, field } from '../ui'
import { cx } from '../lib'

const COLORS = ['bg-amber-500', 'bg-blue-500', 'bg-violet-500', 'bg-teal', 'bg-emerald-600', 'bg-rose-500', 'bg-cyan-600']

export function useWorkflowActions() {
  const { ws, update, toast } = useApp()
  const steps = ws.workflow
  const setSteps = (next: string[], remap?: (s: string) => string, log?: string) => update((w) => ({ ...w, workflow: next, orders: remap ? w.orders.map((o) => ({ ...o, stage: remap(o.stage) })) : w.orders }), log ? { text: log, kind: 'system' } : undefined)
  const rename = (i: number, name: string) => { const old = steps[i]; setSteps(steps.map((s, k) => k === i ? name : s), (s) => s === old ? name : s) }
  const remove = (i: number) => {
    if (steps.length <= 2) return toast('Keep at least two work statuses')
    const old = steps[i], next = steps.filter((_, k) => k !== i)
    setSteps(next, (s) => s === old ? next[Math.min(i, next.length - 1)] : s, `Work status "${old}" removed`)
    toast('Status removed')
  }
  const add = (name: string) => {
    const value = name.trim()
    if (!value) return false
    if (steps.some((s) => s.toLowerCase() === value.toLowerCase())) { toast('That status already exists'); return false }
    setSteps([...steps, value], undefined, `Work status "${value}" added`)
    toast('Status added'); return true
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= steps.length || from === to) return
    const next = [...steps], [item] = next.splice(from, 1); next.splice(to, 0, item); setSteps(next)
  }
  return { steps, rename, remove, add, move }
}

export default function WorkflowPage() {
  const { ws } = useApp()
  const { steps, rename, remove, add, move } = useWorkflowActions()
  const [name, setName] = useState('')
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  return <>
    <PageHeader title="Work statuses" sub="Set up the stages you use to keep track of your work records." />
    <Card className="p-5">
      <p className="mb-4 text-sm text-muted">Rename, reorder, or remove statuses. These are used to organize your own records.</p>
      <div className="flex flex-wrap items-stretch gap-y-4">
        {steps.map((s, i) => <div key={`${s}-${i}`} className="flex items-center">
          <div draggable onDragStart={() => setDrag(i)} onDragEnd={() => { setDrag(null); setOver(null) }} onDragOver={(e) => { e.preventDefault(); setOver(i) }} onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); setOver(null) }} className={cx('w-52 rounded-xl border bg-white p-3 shadow-sm transition', over === i && drag !== i ? 'border-teal bg-teal-50' : 'border-line', drag === i && 'opacity-40')}>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted"><GripVertical size={14} className="cursor-grab" /><span className={cx('size-2.5 rounded-full', COLORS[i % COLORS.length])} />Status {i + 1}</div>
            <input aria-label={`Rename status ${i + 1}`} defaultValue={s} key={s} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== s) rename(i, v); else e.target.value = s }} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className={field + ' font-medium'} />
            <div className="mt-2 flex items-center justify-between"><div className="flex gap-1"><button aria-label="Move left" disabled={i === 0} onClick={() => move(i, i - 1)} className="rounded border border-line p-1 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={14} /></button><button aria-label="Move right" disabled={i === steps.length - 1} onClick={() => move(i, i + 1)} className="rounded border border-line p-1 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={14} /></button></div><span className="text-xs text-muted">{ws.orders.filter((o) => o.stage === s).length} records</span><button aria-label="Remove status" onClick={() => remove(i)} className="rounded border border-line p-1 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></div>
          </div>{i < steps.length - 1 && <ArrowRight size={18} className="mx-2 shrink-0 text-slate-300" />}
        </div>)}
      </div>
      <form className="mt-6 flex max-w-md gap-2 border-t border-line pt-5" onSubmit={(e) => { e.preventDefault(); if (add(name)) setName('') }}><input className={field} placeholder="New status name" value={name} onChange={(e) => setName(e.target.value)} /><Button variant="primary" type="submit"><Plus size={16} />Add status</Button></form>
    </Card>
  </>
}
