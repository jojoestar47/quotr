import { useState, useEffect } from 'react'
import { Btn, Modal, Input } from './ui'
import { formatCurrency } from '../lib/format'

export default function QuotePanel({ quoteNumber, lines, customer, setCustomer, discount, setDiscount, onSave, onMarkSent, saving }) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const discAmt = subtotal * (Math.max(0, Math.min(100, discount)) / 100)
  const total = subtotal - discAmt

  const [previewOpen, setPreviewOpen] = useState(false)

  // Line manipulation
  const [lineNotes, setLineNotes] = useState({})
  useEffect(() => {
    const notes = {}
    lines.forEach(l => { notes[l.productId] = l.note ?? '' })
    setLineNotes(notes)
  }, [lines.length])

  return (
    <aside className="flex flex-col h-full overflow-hidden bg-[#13171f] border-l border-white/[0.06] w-[370px] shrink-0">
      {/* Quote header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#64748b]">Quote</span>
          <span className="font-mono text-[11px] text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded">{quoteNumber}</span>
        </div>
        <button onClick={onSave} className="text-[11px] font-semibold text-[#64748b] hover:text-[#e2e8f0] px-2.5 py-1 rounded border border-white/10 bg-transparent cursor-pointer transition-colors">
          Save draft
        </button>
      </div>

      {/* Customer */}
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="text-[10px] font-bold tracking-widest uppercase text-[#64748b] mb-2">Customer Details</div>
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="Customer name" value={customer.name} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} />
          <Input placeholder="Phone" value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} />
          <Input placeholder="Email (optional)" className="col-span-2" value={customer.email} onChange={e => setCustomer(p => ({ ...p, email: e.target.value }))} />
        </div>
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#64748b]">
            <div className="text-3xl opacity-20">📋</div>
            <p className="text-sm">No items yet</p>
            <p className="text-[11px] opacity-60">Search and click + to add products</p>
          </div>
        ) : (
          lines.map((line, idx) => (
            <LineRow
              key={line.productId}
              line={line}
              note={lineNotes[line.productId] ?? ''}
              onNoteChange={val => setLineNotes(prev => ({ ...prev, [line.productId]: val }))}
              onQtyChange={(delta) => {
                const newLines = [...lines]
                newLines[idx] = { ...line, qty: Math.max(1, line.qty + delta), note: lineNotes[line.productId] ?? '' }
                // bubble up via parent
              }}
              onRemove={() => {}}
            />
          ))
        )}
      </div>

      {/* Totals */}
      {lines.length > 0 && (
        <div className="border-t border-white/[0.06] px-4 py-3 shrink-0">
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="text-[#94a3b8]">Subtotal</span>
            <span className="font-mono text-[#e2e8f0]">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] text-[#94a3b8] flex-1">Discount (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-14 text-right font-mono text-[12px] text-amber-300 bg-[#0c0f16] border border-white/10 rounded px-2 py-1 focus:border-amber-400/40 focus:outline-none"
            />
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[12px] mb-1.5">
              <span className="text-[#94a3b8]">Discount</span>
              <span className="font-mono text-emerald-400">-{formatCurrency(discAmt)}</span>
            </div>
          )}
          <div className="h-px bg-white/[0.06] my-2" />
          <div className="flex justify-between items-baseline">
            <span className="text-[13px] font-semibold">Total (excl. tax)</span>
            <span className="font-mono text-[17px] font-bold text-teal-300">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 pt-2 flex gap-2 shrink-0 border-t border-white/[0.06]">
        <Btn variant="ghost" className="flex-1 text-[12px]" onClick={() => setPreviewOpen(true)} disabled={lines.length === 0}>
          Preview
        </Btn>
        <Btn variant="primary" className="flex-[2] text-[12px]" onClick={async () => { await onSave('sent'); onMarkSent?.() }} disabled={lines.length === 0 || saving}>
          {saving ? 'Saving…' : '✉️  Email Quote'}
        </Btn>
      </div>

      {/* Preview modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Quote Preview" subtitle={`${customer.name || 'Customer'} — ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`} width="max-w-md">
        {lines.map(l => (
          <div key={l.productId} className="flex justify-between py-2 border-b border-white/[0.06] text-[13px]">
            <span className="text-[#94a3b8]">{l.qty}× {l.name} <span className="font-mono text-[11px] text-[#64748b]">({l.code})</span>{l.note ? ` — ${l.note}` : ''}</span>
            <span className="font-mono shrink-0 ml-4">{formatCurrency(l.price * l.qty)}</span>
          </div>
        ))}
        {discount > 0 && (
          <div className="flex justify-between py-2 border-b border-white/[0.06] text-[13px]">
            <span className="text-[#94a3b8]">Discount ({discount}%)</span>
            <span className="font-mono text-emerald-400">-{formatCurrency(discAmt)}</span>
          </div>
        )}
        <div className="flex justify-between pt-4 font-bold text-[15px]">
          <span>Total (excl. tax)</span>
          <span className="font-mono text-teal-300">{formatCurrency(total)}</span>
        </div>
        <div className="flex gap-2 mt-5">
          <Btn variant="ghost" className="flex-1">🖨 Print / PDF</Btn>
          <Btn variant="primary" className="flex-[2]" onClick={async () => { await onSave('sent'); setPreviewOpen(false) }}>
            ✉️ Email to Customer
          </Btn>
        </div>
      </Modal>
    </aside>
  )
}

function LineRow({ line, note, onNoteChange }) {
  return (
    <div className="px-2 py-2 rounded-lg border-b border-white/[0.04] hover:bg-[#1a1f2b] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium mb-1 truncate">
            {line.name} <span className="text-[10px] text-[#64748b] font-mono">{line.code}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#64748b]">@ {formatCurrency(line.price)} ea</span>
          </div>
          <input
            type="text"
            placeholder="Note (size, finish, install…)"
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            className="mt-1.5 w-full bg-transparent border-b border-white/[0.06] text-[11px] text-[#94a3b8] placeholder:text-[#64748b]/60 focus:outline-none focus:border-teal-400/40 pb-0.5"
          />
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="font-mono text-[12px]">{formatCurrency(line.price * line.qty)}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] bg-[#1a1f2b] border border-white/10 rounded px-1.5 py-0.5 font-mono">{line.qty}×</span>
          </div>
        </div>
      </div>
    </div>
  )
}
