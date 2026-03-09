import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProducts({ includeInactive = false } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    let query = supabase.from('products').select('*').order('category').order('name')
    if (!includeInactive) query = query.eq('active', true)
    const { data, error } = await query
    if (error) setError(error.message)
    else setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [includeInactive])

  async function createProduct(values) {
    const { data, error } = await supabase.from('products').insert(values).select().single()
    if (!error) setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { data, error }
  }

  async function updateProduct(id, values) {
    const { data, error } = await supabase.from('products').update(values).eq('id', id).select().single()
    if (!error) setProducts(prev => prev.map(p => p.id === id ? data : p))
    return { data, error }
  }

  async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort()

  return { products, categories, loading, error, createProduct, updateProduct, deleteProduct, reload: load }
}
