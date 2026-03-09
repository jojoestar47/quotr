// Shared UI primitives used across the app

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-[#0c0f16] border border-white/10 rounded-md text-[#e2e8f0] text-sm px-3 py-2 placeholder:text-[#64748b] focus:border-teal-400/50 focus:outline-none transition-colors ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full bg-[#0c0f16] border border-white/10 rounded-md text-[#e2e8f0] text-sm px-3 py-2 focus:border-teal-400/50 focus:outline-none transition-colors cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full bg-[#0c0f16] border border-white/10 rounded-md text-[#e2e8f0] text-sm px-3 py-2 placeholder:text-[#64748b] focus:border-teal-400/50 focus:outline-none transition-colors resize-none ${className}`}
      {...props}
    />
  )
}

export function Label({ children, className = '' }) {
  return (
    <label className={`block text-[10px] font-bold tracking-widest uppercase text-[#64748b] mb-1.5 ${className}`}>
      {children}
    </label>
  )
}

export function Field({ label, children }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
    </div>
  )
}

export function Btn({ variant = 'ghost', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 cursor-pointer border-none font-[DM_Sans]'
  const sizes = {
    sm: 'text-[11px] px-3 py-1.5',
    md: 'text-[13px] px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  }
  const variants = {
    primary: 'bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-[0_4px_14px_rgba(45,212,191,0.25)] hover:opacity-90 active:scale-[0.98]',
    ghost: 'bg-transparent border border-white/10 text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/5',
    danger: 'bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#f87171] hover:bg-[rgba(248,113,113,0.15)]',
    amber: 'bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[#f59e0b] hover:bg-[rgba(245,158,11,0.18)]',
    blue: 'bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.2)] text-[#60a5fa] hover:bg-[rgba(96,165,250,0.15)]',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Badge({ variant = 'teal', children }) {
  const styles = {
    teal: 'bg-teal-400/10 text-teal-300 border border-teal-400/25',
    amber: 'bg-amber-400/10 text-amber-300 border border-amber-400/25',
    green: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/25',
    red: 'bg-red-400/10 text-red-300 border border-red-400/25',
    blue: 'bg-blue-400/10 text-blue-300 border border-blue-400/25',
    yellow: 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/25',
  }
  return (
    <span className={`inline-block text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${styles[variant]}`}>
      {children}
    </span>
  )
}

export function StockBadge({ status }) {
  if (status === 'in')  return <Badge variant="green">In Stock</Badge>
  if (status === 'low') return <Badge variant="yellow">Low Stock</Badge>
  return <Badge variant="red">Out of Stock</Badge>
}

export function StatusBadge({ status }) {
  if (status === 'sent')     return <Badge variant="green">Sent</Badge>
  if (status === 'accepted') return <Badge variant="teal">Accepted</Badge>
  if (status === 'expired')  return <Badge variant="red">Expired</Badge>
  return <Badge variant="yellow">Draft</Badge>
}

export function Avatar({ firstName = '', lastName = '', className = '' }) {
  const colors = ['from-teal-400 to-cyan-600', 'from-amber-400 to-orange-500', 'from-purple-400 to-violet-600', 'from-blue-400 to-indigo-500']
  const idx = ((firstName.charCodeAt(0) || 0) + (lastName.charCodeAt(0) || 0)) % colors.length
  return (
    <div className={`rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-bold select-none shrink-0 ${className}`}>
      {(firstName[0] ?? '').toUpperCase()}{(lastName[0] ?? '').toUpperCase()}
    </div>
  )
}

export function Toast({ message, show }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#1a1f2b] border border-white/10 border-l-2 border-l-emerald-400 px-4 py-2.5 rounded-lg shadow-2xl text-sm text-[#e2e8f0] transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <span className="text-emerald-400">✓</span> {message}
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`relative bg-[#13171f] border border-white/10 rounded-xl shadow-2xl p-7 w-full mx-4 max-h-[85vh] overflow-y-auto ${width}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[#64748b] hover:text-[#e2e8f0] text-xl leading-none bg-transparent border-none cursor-pointer">&times;</button>
        {title && <h2 className="text-lg font-bold tracking-tight mb-0.5">{title}</h2>}
        {subtitle && <p className="text-xs text-[#64748b] mb-5">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="w-6 h-6 border-2 border-white/10 border-t-teal-400 rounded-full animate-spin" />
    </div>
  )
}
