import { useQuotes } from '../hooks/useQuotes'
import { StatusBadge, Spinner } from './ui'
import { formatCurrency, formatDate } from '../lib/format'

export default function AdminQuotes() {
  const { quotes, loading } = useQuotes({ adminView: true })

  const thisMonth = quotes.filter(q => {
    const d = new Date(q.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const avgValue = thisMonth.length
    ? thisMonth.reduce((s, q) => s + parseFloat(q.total), 0) / thisMonth.length
    : 0

  const sent = thisMonth.filter(q => q.status === 'sent' || q.status === 'accepted').length

  if (loading) return <Spinner />

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[18px] font-bold tracking-tight mb-1">Quote History</h2>
        <p className="text-[13px] text-[#64748b]">All quotes across the team</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'This Month', value: thisMonth.length, sub: 'quotes', color: 'text-teal-300' },
          { label: 'Avg Value', value: formatCurrency(avgValue), sub: 'per quote', color: 'text-amber-300' },
          { label: 'Sent', value: sent, sub: 'emailed', color: 'text-emerald-400' },
          { label: 'Total All Time', value: quotes.length, sub: 'quotes', color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#13171f] border border-white/[0.06] rounded-xl p-4">
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#64748b] mb-1.5">{stat.label}</div>
            <div className={`text-[22px] font-bold font-mono tracking-tight ${stat.color}`}>{stat.value}</div>
            <div className="text-[11px] text-[#64748b] mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#13171f] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#1a1f2b]">
              {['Quote ID', 'Customer', 'Staff', 'Date', 'Total', 'Status'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold tracking-[0.08em] uppercase text-[#64748b] px-3.5 py-2.5 border-b border-white/[0.06]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#64748b] text-sm">No quotes yet</td></tr>
            )}
            {quotes.map(q => (
              <tr key={q.id} className="border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors">
                <td className="px-3.5 py-3 font-mono text-[11px] text-[#94a3b8]">{q.quote_number}</td>
                <td className="px-3.5 py-3 text-[13px]">{q.customer_name || '—'}</td>
                <td className="px-3.5 py-3 text-[12px] text-[#64748b]">
                  {q.user_profiles ? `${q.user_profiles.first_name} ${q.user_profiles.last_name?.[0]}.` : '—'}
                </td>
                <td className="px-3.5 py-3 text-[12px] text-[#64748b]">{formatDate(q.created_at)}</td>
                <td className="px-3.5 py-3 font-mono text-[13px] text-teal-300">{formatCurrency(q.total)}</td>
                <td className="px-3.5 py-3"><StatusBadge status={q.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
