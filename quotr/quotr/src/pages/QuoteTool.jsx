import { useState, useRef } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useQuotes } from '../hooks/useQuotes'
import { useAuth } from '../hooks/useAuth'
import ProductList from '../components/ProductList'
import QuotePanel from '../components/QuotePanel'
import { Toast, Spinner } from '../components/ui'

export default function QuoteTool() {
  const { user } = useAuth()
  const { products, categories, loading } = useProducts()
  const { saveQuote } = useQuotes()

  const [lines, setLines] = useState([])
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' })
  const [discount, setDiscount] = useState(0)
  const [quoteNum, setQuoteNum] = useState(null) // resolved on first save
  const [quoteId, setQuoteId] = useState(null)
  const [lastAdded, setLastAdded] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [saving, setSaving] = useState(false)
  const flashTimer = useRef(null)

  function showToast(message) {
    setToast({ show: true, message })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500)
  }

  function addProduct(product) {
    setLines(prev => {
      const existing = prev.find(l => l.productId === product.id)
      if (existing) return prev.map(l => l.productId === product.id ? { ...l, qty: l.qty + 1 } : l)
      return [...prev, { productId: product.id, name: product.name, code: product.code, price: parseFloat(product.price), qty: 1, note: '' }]
    })
    setLastAdded(product.id)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setLastAdded(null), 600)
    showToast(`${product.name} added`)
  }

  function newQuote() {
    setLines([])
    setCustomer({ name: '', phone: '', email: '' })
    setDiscount(0)
    setQuoteId(null)
    setQuoteNum(null)
  }

  async function handleSave(status = 'draft') {
    if (lines.length === 0) return
    setSaving(true)
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
    const discAmt = subtotal * (Math.max(0, Math.min(100, discount)) / 100)
    const total = subtotal - discAmt

    const { quoteId: savedId, error } = await saveQuote({
      lines, customer, discountPct: discount, subtotal, total,
      userId: user.id, status, existingId: quoteId
    })

    if (error) {
      showToast('Error saving quote')
    } else {
      setQuoteId(savedId)
      showToast(status === 'sent' ? 'Quote saved and marked as sent' : 'Draft saved')
    }
    setSaving(false)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner /></div>

  // Derive display quote number
  const displayNum = quoteNum ?? `QT-${new Date().getFullYear()}-????`

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Product catalogue */}
      <main className="flex-1 overflow-hidden flex flex-col bg-[#0c0f16]">
        <ProductList
          products={products}
          categories={categories}
          onAdd={addProduct}
          lastAdded={lastAdded}
        />
      </main>

      {/* Quote builder */}
      <QuotePanel
        quoteNumber={displayNum}
        lines={lines}
        customer={customer}
        setCustomer={setCustomer}
        discount={discount}
        setDiscount={setDiscount}
        onSave={handleSave}
        onMarkSent={() => { newQuote(); showToast('Quote sent!') }}
        saving={saving}
        onNewQuote={newQuote}
      />

      <Toast show={toast.show} message={toast.message} />
    </div>
  )
}
