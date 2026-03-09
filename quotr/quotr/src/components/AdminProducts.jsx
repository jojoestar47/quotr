import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { Btn, Input, Select, Field, Label, StockBadge, Toast, Spinner } from './ui'
import { formatCurrency } from '../lib/format'
import BulkUpload from './BulkUpload'

const EMPTY = { name: '', code: '', category: '', size: '', material: '', price: '', stock_status: 'in' }

export default function AdminProducts() {
  const { products, categories, loading, createProduct, updateProduct, deleteProduct, reload } = useProducts({ includeInactive: true })
  const [form, setForm] = useState(null) // null = hidden, {} = new, {id,...} = editing
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  function showToast(msg) {
    setToast({ show: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500)
  }

  function openNew() { setForm({ ...EMPTY }) }
  function openEdit(p) { setForm({ ...p, price: String(p.price) }) }
  function closeForm() { setForm(null) }

  async function handleSave() {
    if (!form.name || !form.code || !form.price) return
    setSaving(true)
    const payload = { ...form, price: parseFloat(form.price) }
    const isNew = !form.id
    const { error } = isNew ? await createProduct(payload) : await updateProduct(form.id, payload)
    setSaving(false)
    if (error) { showToast('Error saving product'); return }
    showToast(isNew ? 'Product added' : 'Product updated')
    closeForm()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return
    const { error } = await deleteProduct(id)
    if (error) showToast('Error deleting product')
    else showToast('Product deleted')
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight mb-1">Products &amp; Pricing</h2>
          <p className="text-[13px] text-[#64748b]">Manage your product catalogue</p>
        </div>
        <div className="flex gap-2">
          <BulkUpload onComplete={() => { reload(); showToast("Bulk import complete") }} />
          <Btn variant="primary" onClick={openNew}>+ Add Product</Btn>
        </div>
      </div>

      {/* Form */}
      {form && (
        <div className="bg-[#13171f] border border-white/10 rounded-xl p-5 mb-5">
          <h3 className="text-[14px] font-semibold mb-4">{form.id ? '✏️ Edit Product' : '+ New Product'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product Name"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Heritage Panel Door" /></Field>
            <Field label="Code / SKU"><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="HD-102" /></Field>
            <Field label="Price ($)"><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></Field>
            <Field label="Category">
              <Input
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Entry, Interior, French"
                list="cat-list"
              />
              <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Size"><Input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="2040x920mm" /></Field>
            <Field label="Material"><Input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} placeholder="Timber" /></Field>
            <Field label="Stock Status">
              <Select value={form.stock_status} onChange={e => setForm(f => ({ ...f, stock_status: e.target.value }))}>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-2 mt-4">
            <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</Btn>
            <Btn variant="ghost" onClick={closeForm}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#13171f] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#1a1f2b]">
              {['Product', 'Code', 'Category', 'Stock', 'Price', 'Actions'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold tracking-[0.08em] uppercase text-[#64748b] px-3.5 py-2.5 border-b border-white/[0.06]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className={`border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors ${!p.active ? 'opacity-40' : ''}`}>
                <td className="px-3.5 py-3 text-[13px]">{p.name}</td>
                <td className="px-3.5 py-3 font-mono text-[11px] text-[#94a3b8]">{p.code}</td>
                <td className="px-3.5 py-3 text-[12px] text-[#64748b]">{p.category}</td>
                <td className="px-3.5 py-3"><StockBadge status={p.stock_status} /></td>
                <td className="px-3.5 py-3 font-mono text-[13px] text-teal-300">{formatCurrency(p.price)}</td>
                <td className="px-3.5 py-3">
                  <div className="flex gap-1.5">
                    <Btn variant="blue" size="sm" onClick={() => openEdit(p)}>Edit</Btn>
                    <Btn variant="danger" size="sm" onClick={() => handleDelete(p.id)}>Delete</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  )
}
