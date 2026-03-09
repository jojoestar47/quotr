import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useQuotes({ adminView = false } = {}) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const query = supabase
      .from('quotes')
      .select(`*, user_profiles(first_name, last_name), quote_lines(*)`)
      .order('created_at', { ascending: false })
    const { data } = await query
    setQuotes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [adminView])

  async function getNextQuoteNumber() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'next_quote_num').single()
    const num = parseInt(data?.value ?? '1')
    const padded = String(num).padStart(4, '0')
    const year = new Date().getFullYear()
    await supabase.from('settings').update({ value: String(num + 1) }).eq('key', 'next_quote_num')
    return `QT-${year}-${padded}`
  }

  async function saveQuote({ lines, customer, discountPct, subtotal, total, userId, status = 'draft', existingId = null }) {
    const quoteNumber = existingId
      ? quotes.find(q => q.id === existingId)?.quote_number
      : await getNextQuoteNumber()

    const quoteData = {
      quote_number: quoteNumber,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      discount_pct: discountPct,
      subtotal,
      total,
      status,
      created_by: userId,
    }

    let quoteId = existingId
    if (existingId) {
      const { error } = await supabase.from('quotes').update(quoteData).eq('id', existingId)
      if (error) return { error }
      await supabase.from('quote_lines').delete().eq('quote_id', existingId)
    } else {
      const { data, error } = await supabase.from('quotes').insert(quoteData).select().single()
      if (error) return { error }
      quoteId = data.id
    }

    const lineRows = lines.map((l, i) => ({
      quote_id: quoteId,
      product_id: l.productId,
      product_name: l.name,
      product_code: l.code,
      unit_price: l.price,
      quantity: l.qty,
      line_total: l.price * l.qty,
      note: l.note ?? '',
      sort_order: i,
    }))

    const { error: lineError } = await supabase.from('quote_lines').insert(lineRows)
    if (lineError) return { error: lineError }

    await load()
    return { quoteId }
  }

  async function markSent(quoteId) {
    await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', quoteId)
    await load()
  }

  async function deleteQuote(quoteId) {
    await supabase.from('quotes').delete().eq('id', quoteId)
    setQuotes(prev => prev.filter(q => q.id !== quoteId))
  }

  return { quotes, loading, saveQuote, markSent, deleteQuote, reload: load }
}
