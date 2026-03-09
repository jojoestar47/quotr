import { useState, useMemo } from 'react'
import { StockBadge } from './ui'
import { formatCurrency } from '../lib/format'

export default function ProductList({ products, categories, onAdd, lastAdded }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.size.toLowerCase().includes(q) || p.material.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [products, search, activeCategory])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#64748b]">Products</span>
          <span className="text-[11px] text-[#64748b]">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Search */}
        <div className="relative mb-2.5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-xs pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code, size…"
            className="w-full bg-[#1a1f2b] border border-white/10 rounded-lg text-sm text-[#e2e8f0] pl-8 pr-10 py-2 placeholder:text-[#64748b] focus:border-teal-400/40 focus:outline-none transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#64748b] bg-[#222836] border border-white/10 rounded px-1.5 py-0.5">/</kbd>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[11px] font-medium px-3 py-1 rounded-full border cursor-pointer transition-all ${
                activeCategory === cat
                  ? 'bg-teal-400/10 border-teal-400/35 text-teal-300'
                  : 'bg-transparent border-white/10 text-[#64748b] hover:text-[#94a3b8] hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-[#64748b]">
            <div className="text-3xl opacity-30">🔍</div>
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          filtered.map(p => (
            <ProductRow
              key={p.id}
              product={p}
              onAdd={onAdd}
              flash={lastAdded === p.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ProductRow({ product: p, onAdd, flash }) {
  return (
    <div
      className={`group grid items-center px-2 py-2 rounded-lg cursor-pointer transition-all ${flash ? 'bg-teal-400/10' : 'hover:bg-[#1a1f2b]'}`}
      style={{ gridTemplateColumns: '52px 1fr auto' , gap: '10px' }}
      onClick={() => onAdd(p)}
    >
      {/* Thumb */}
      <div className="w-[52px] h-[68px] rounded-md bg-[#1a1f2b] border border-white/10 flex items-center justify-center text-2xl shrink-0">
        {p.category === 'Fire Rated' ? '🔥' : p.category === 'French' ? '🔲' : '🚪'}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-[#e2e8f0] truncate mb-1">{p.name}</div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#64748b]">
          <span className="font-mono">{p.code}</span>
          <span>{p.size}</span>
          <span>{p.material}</span>
          <StockBadge status={p.stock_status} />
        </div>
      </div>

      {/* Price + add */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="font-mono text-[13px] font-medium text-teal-300">{formatCurrency(p.price)}</span>
        <button
          onClick={e => { e.stopPropagation(); onAdd(p) }}
          className="opacity-0 group-hover:opacity-100 text-[11px] font-semibold px-2.5 py-1 rounded bg-teal-400/10 border border-teal-400/30 text-teal-300 hover:bg-teal-400/18 transition-all cursor-pointer"
        >
          + Add
        </button>
      </div>
    </div>
  )
}
