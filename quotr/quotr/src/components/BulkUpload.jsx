import { useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Btn, Modal, Badge, Spinner } from './ui'
import { formatCurrency } from '../lib/format'

// The product fields we want to map to
const PRODUCT_FIELDS = [
  { key: 'name',         label: 'Product Name', required: true  },
  { key: 'code',         label: 'Code / SKU',   required: true  },
  { key: 'price',        label: 'Price',        required: true  },
  { key: 'category',     label: 'Category',     required: false },
  { key: 'size',         label: 'Size',         required: false },
  { key: 'material',     label: 'Material',     required: false },
  { key: 'stock_status', label: 'Stock Status', required: false },
]

// Try to auto-match a spreadsheet column header to a product field
function autoMatch(header) {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (['name','productname','product','title','description'].includes(h)) return 'name'
  if (['code','sku','productcode','itemcode','id','partno','part'].includes(h)) return 'code'
  if (['price','cost','unitprice','rate','amount'].includes(h)) return 'price'
  if (['category','cat','type','group'].includes(h)) return 'category'
  if (['size','dimension','dimensions','width','height'].includes(h)) return 'size'
  if (['material','materials','finish'].includes(h)) return 'material'
  if (['stock','stockstatus','status','availability','available'].includes(h)) return 'stock_status'
  return ''
}

// Normalise stock_status value from whatever user typed
function normaliseStock(val) {
  if (!val) return 'in'
  const v = String(val).toLowerCase().trim()
  if (['out','outofstock','out of stock','0','no','false'].includes(v)) return 'out'
  if (['low','lowstock','low stock','limited'].includes(v)) return 'low'
  return 'in'
}

export default function BulkUpload({ onComplete }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Btn variant="blue" onClick={() => setOpen(true)}>⬆ Bulk Upload</Btn>
      <BulkUploadModal open={open} onClose={() => setOpen(false)} onComplete={() => { setOpen(false); onComplete?.() }} />
    </>
  )
}

function BulkUploadModal({ open, onClose, onComplete }) {
  const [step, setStep] = useState('upload')   // upload | map | preview | done
  const [rows, setRows] = useState([])          // raw parsed rows
  const [headers, setHeaders] = useState([])    // column headers from file
  const [mapping, setMapping] = useState({})    // { colHeader: productFieldKey }
  const [preview, setPreview] = useState([])    // normalised product rows
  const [results, setResults] = useState(null)  // { added, updated, errors }
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  function reset() {
    setStep('upload'); setRows([]); setHeaders([]); setMapping({})
    setPreview([]); setResults(null); setUploading(false)
  }

  function handleClose() { reset(); onClose() }

  // ── Parse file ────────────────────────────────────────────
  async function parseFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'csv') {
      const text = await file.text()
      const lines = text.trim().split('\n').map(l => l.split(',').map(c => c.replace(/^"|"$/g, '').trim()))
      const hdrs = lines[0]
      const data = lines.slice(1).filter(r => r.some(c => c))
      loadParsed(hdrs, data)
    } else if (['xlsx', 'xls'].includes(ext)) {
      // Dynamically import SheetJS from CDN
      const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      const hdrs = data[0].map(String)
      const rows = data.slice(1).filter(r => r.some(c => String(c).trim()))
      loadParsed(hdrs, rows)
    } else {
      alert('Please upload a .csv, .xlsx, or .xls file.')
    }
  }

  function loadParsed(hdrs, data) {
    setHeaders(hdrs)
    setRows(data)
    // Auto-map
    const auto = {}
    hdrs.forEach(h => { const m = autoMatch(h); if (m) auto[h] = m })
    setMapping(auto)
    setStep('map')
  }

  // ── Drag and drop ─────────────────────────────────────────
  const onDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }, [])

  // ── Build preview from mapping ────────────────────────────
  function buildPreview() {
    const mapped = rows.map(row => {
      const obj = {}
      headers.forEach((h, i) => { if (mapping[h]) obj[mapping[h]] = row[i] })
      return {
        name:         String(obj.name ?? '').trim(),
        code:         String(obj.code ?? '').trim().toUpperCase(),
        price:        parseFloat(String(obj.price ?? '0').replace(/[^0-9.]/g, '')) || 0,
        category:     String(obj.category ?? '').trim(),
        size:         String(obj.size ?? '').trim(),
        material:     String(obj.material ?? '').trim(),
        stock_status: normaliseStock(obj.stock_status),
        active:       true,
      }
    }).filter(r => r.name && r.code)
    setPreview(mapped)
    setStep('preview')
  }

  // ── Upsert to Supabase ────────────────────────────────────
  async function handleImport() {
    setUploading(true)
    let added = 0, updated = 0, errors = []

    for (const row of preview) {
      // Check if code already exists
      const { data: existing } = await supabase
        .from('products').select('id').eq('code', row.code).maybeSingle()

      if (existing) {
        const { error } = await supabase.from('products').update(row).eq('id', existing.id)
        if (error) errors.push(`${row.code}: ${error.message}`)
        else updated++
      } else {
        const { error } = await supabase.from('products').insert(row)
        if (error) errors.push(`${row.code}: ${error.message}`)
        else added++
      }
    }

    setResults({ added, updated, errors })
    setUploading(false)
    setStep('done')
  }

  const requiredMapped = PRODUCT_FIELDS.filter(f => f.required).every(f =>
    Object.values(mapping).includes(f.key)
  )

  if (!open) return null

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Upload Products" subtitle="Import from Excel or CSV — existing products are updated by code, new ones are added." width="max-w-3xl">

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {['Upload', 'Map Fields', 'Preview', 'Done'].map((s, i) => {
          const stepKeys = ['upload', 'map', 'preview', 'done']
          const current = stepKeys.indexOf(step)
          const active = i === current
          const done = i < current
          return (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                active ? 'bg-teal-400/15 text-teal-300 border border-teal-400/30' :
                done   ? 'text-emerald-400' : 'text-[#64748b]'
              }`}>
                {done ? '✓' : i + 1}. {s}
              </div>
              {i < 3 && <div className="w-5 h-px bg-white/10" />}
            </div>
          )
        })}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div>
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-teal-400/60 bg-teal-400/5' : 'border-white/10 hover:border-white/20'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}
          >
            <div className="text-4xl mb-3 opacity-50">📂</div>
            <p className="text-[14px] font-medium text-[#e2e8f0] mb-1">Drop your file here or click to browse</p>
            <p className="text-[12px] text-[#64748b]">Supports .xlsx, .xls, and .csv</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => e.target.files[0] && parseFile(e.target.files[0])} />
          </div>

          <div className="mt-5 bg-[#1a1f2b] rounded-lg p-4">
            <p className="text-[11px] font-bold tracking-wider uppercase text-[#64748b] mb-2">Expected columns (any order, any name)</p>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_FIELDS.map(f => (
                <span key={f.key} className={`text-[11px] px-2 py-0.5 rounded border font-mono ${f.required ? 'border-teal-400/30 text-teal-300 bg-teal-400/5' : 'border-white/10 text-[#64748b]'}`}>
                  {f.label}{f.required ? ' *' : ''}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[#64748b] mt-2">* Required. You'll match columns to fields in the next step.</p>
          </div>

          <div className="flex justify-end mt-4">
            <Btn variant="ghost" onClick={handleClose}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* STEP 2: Map fields */}
      {step === 'map' && (
        <div>
          <p className="text-[13px] text-[#94a3b8] mb-4">
            {rows.length} rows detected. Match your spreadsheet columns to product fields below.
          </p>
          <div className="bg-[#13171f] border border-white/[0.06] rounded-xl overflow-hidden mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1a1f2b]">
                  <th className="text-left text-[10px] font-bold tracking-widest uppercase text-[#64748b] px-4 py-2.5 border-b border-white/[0.06]">Your Column</th>
                  <th className="text-left text-[10px] font-bold tracking-widest uppercase text-[#64748b] px-4 py-2.5 border-b border-white/[0.06]">Sample Value</th>
                  <th className="text-left text-[10px] font-bold tracking-widest uppercase text-[#64748b] px-4 py-2.5 border-b border-white/[0.06]">Maps To</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h, i) => (
                  <tr key={h} className="border-b border-white/[0.04]">
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#94a3b8]">{h}</td>
                    <td className="px-4 py-2.5 text-[12px] text-[#64748b] max-w-[160px] truncate">{String(rows[0]?.[i] ?? '')}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={mapping[h] ?? ''}
                        onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                        className="bg-[#0c0f16] border border-white/10 rounded text-[12px] text-[#e2e8f0] px-2 py-1.5 focus:border-teal-400/40 focus:outline-none cursor-pointer"
                      >
                        <option value="">— Skip —</option>
                        {PRODUCT_FIELDS.map(f => (
                          <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!requiredMapped && (
            <p className="text-[12px] text-amber-400 mb-3">⚠ Please map all required fields (Name, Code, Price) before continuing.</p>
          )}

          <div className="flex gap-2 justify-end">
            <Btn variant="ghost" onClick={reset}>Back</Btn>
            <Btn variant="primary" onClick={buildPreview} disabled={!requiredMapped}>Preview Import →</Btn>
          </div>
        </div>
      )}

      {/* STEP 3: Preview */}
      {step === 'preview' && (
        <div>
          <p className="text-[13px] text-[#94a3b8] mb-4">
            {preview.length} valid products ready to import. Existing products (matched by Code) will be updated; new ones will be added.
          </p>
          <div className="bg-[#13171f] border border-white/[0.06] rounded-xl overflow-hidden mb-4 max-h-[340px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#1a1f2b]">
                <tr>
                  {['Name', 'Code', 'Category', 'Size', 'Material', 'Price', 'Stock'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold tracking-widest uppercase text-[#64748b] px-3 py-2.5 border-b border-white/[0.06]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.015]">
                    <td className="px-3 py-2 text-[12px]">{p.name}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-[#94a3b8]">{p.code}</td>
                    <td className="px-3 py-2 text-[12px] text-[#64748b]">{p.category || '—'}</td>
                    <td className="px-3 py-2 text-[12px] text-[#64748b]">{p.size || '—'}</td>
                    <td className="px-3 py-2 text-[12px] text-[#64748b]">{p.material || '—'}</td>
                    <td className="px-3 py-2 font-mono text-[12px] text-teal-300">{formatCurrency(p.price)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        p.stock_status === 'in'  ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25' :
                        p.stock_status === 'low' ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/25' :
                                                   'bg-red-400/10 text-red-300 border-red-400/25'
                      }`}>{p.stock_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-end">
            <Btn variant="ghost" onClick={() => setStep('map')}>Back</Btn>
            <Btn variant="primary" onClick={handleImport} disabled={uploading}>
              {uploading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" /> Importing…</span> : `Import ${preview.length} Products`}
            </Btn>
          </div>
        </div>
      )}

      {/* STEP 4: Done */}
      {step === 'done' && results && (
        <div className="text-center py-4">
          <div className="text-5xl mb-4">{results.errors.length === 0 ? '✅' : '⚠️'}</div>
          <h3 className="text-[17px] font-bold mb-1">Import complete</h3>
          <p className="text-[13px] text-[#94a3b8] mb-5">Your product catalogue has been updated.</p>

          <div className="flex justify-center gap-3 mb-5">
            <div className="bg-[#1a1f2b] border border-white/[0.06] rounded-xl px-6 py-4 text-center">
              <div className="text-[26px] font-bold text-emerald-400 font-mono">{results.added}</div>
              <div className="text-[11px] text-[#64748b] mt-0.5">Added</div>
            </div>
            <div className="bg-[#1a1f2b] border border-white/[0.06] rounded-xl px-6 py-4 text-center">
              <div className="text-[26px] font-bold text-blue-400 font-mono">{results.updated}</div>
              <div className="text-[11px] text-[#64748b] mt-0.5">Updated</div>
            </div>
            {results.errors.length > 0 && (
              <div className="bg-[#1a1f2b] border border-white/[0.06] rounded-xl px-6 py-4 text-center">
                <div className="text-[26px] font-bold text-red-400 font-mono">{results.errors.length}</div>
                <div className="text-[11px] text-[#64748b] mt-0.5">Errors</div>
              </div>
            )}
          </div>

          {results.errors.length > 0 && (
            <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-3 text-left mb-4 max-h-32 overflow-y-auto">
              {results.errors.map((e, i) => <p key={i} className="text-[12px] text-red-300 font-mono">{e}</p>)}
            </div>
          )}

          <Btn variant="primary" onClick={() => { onComplete?.() }}>Done</Btn>
        </div>
      )}
    </Modal>
  )
}
