import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'
import { Input, Field, Btn, Toast, Spinner } from './ui'

export default function AdminSettings() {
  const { settings, loading, saveAll } = useSettings()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    if (!loading) setForm(settings)
  }, [loading])

  function showToast(msg) {
    setToast({ show: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500)
  }

  async function handleSave() {
    setSaving(true)
    await saveAll(form)
    setSaving(false)
    showToast('Settings saved')
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[18px] font-bold tracking-tight mb-1">Settings</h2>
        <p className="text-[13px] text-[#64748b]">Business details and configuration</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Business */}
        <div className="bg-[#13171f] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-[14px] font-semibold mb-4">🏢 Business Details</h3>
          <div className="flex flex-col gap-3">
            <Field label="Business Name"><Input value={form.business_name ?? ''} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Acme Building Supplies" /></Field>
            <Field label="Phone"><Input value={form.business_phone ?? ''} onChange={e => setForm(f => ({ ...f, business_phone: e.target.value }))} placeholder="(08) 9000 1234" /></Field>
            <Field label="Email"><Input type="email" value={form.business_email ?? ''} onChange={e => setForm(f => ({ ...f, business_email: e.target.value }))} placeholder="sales@yourbusiness.com.au" /></Field>
            <Field label="Quote Footer"><Input value={form.quote_footer ?? ''} onChange={e => setForm(f => ({ ...f, quote_footer: e.target.value }))} placeholder="All prices excl. GST. Valid for 30 days." /></Field>
          </div>
        </div>

        {/* Connection status */}
        <div className="bg-[#13171f] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-[14px] font-semibold mb-4">☁️ Supabase Connection</h3>
          <div className="flex flex-col gap-3">
            <Field label="Project URL">
              <Input value={import.meta.env.VITE_SUPABASE_URL ?? ''} readOnly className="opacity-50 cursor-not-allowed" />
            </Field>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="text-[13px] text-emerald-400">Connected — Supabase free tier</span>
            </div>
            <p className="text-[12px] text-[#64748b] leading-relaxed mt-1">
              Database credentials are set via environment variables and never exposed in settings. Contact your developer to update them.
            </p>
          </div>
        </div>

        {/* Quote numbering */}
        <div className="bg-[#13171f] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-[14px] font-semibold mb-4">🔢 Quote Numbering</h3>
          <Field label="Next Quote Number">
            <Input
              type="number"
              value={form.next_quote_num ?? '1'}
              onChange={e => setForm(f => ({ ...f, next_quote_num: e.target.value }))}
              placeholder="1"
            />
          </Field>
          <p className="text-[11px] text-[#64748b] mt-2">
            Quotes are numbered QT-{new Date().getFullYear()}-XXXX. Adjust if importing existing quotes.
          </p>
        </div>

        {/* Branding placeholder */}
        <div className="bg-[#13171f] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-[14px] font-semibold mb-4">🎨 Branding</h3>
          <div
            className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center text-[#64748b] text-[13px] cursor-pointer hover:border-white/20 transition-colors"
          >
            <div className="text-2xl mb-2 opacity-40">🖼</div>
            Click to upload company logo
            <div className="text-[11px] mt-1 opacity-60">PNG or SVG — appears on quote PDFs</div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Btn variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Btn>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  )
}
