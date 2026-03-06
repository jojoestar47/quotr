import { useAuth } from '../hooks/useAuth'
import { Avatar } from './ui'

export default function Topbar({ activePage, onChangePage }) {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <header className="h-[52px] bg-[#13171f] border-b border-white/[0.06] flex items-center px-4 gap-0 shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-4 shrink-0">
        <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-[12px] font-bold text-white">Q</div>
        <span className="text-[15px] font-bold tracking-tight">Quot<span className="text-teal-400">r</span></span>
      </div>

      <div className="w-px h-6 bg-white/[0.06] mx-1 shrink-0" />

      {/* Nav */}
      <nav className="flex h-[52px]">
        <NavTab active={activePage === 'quote'} onClick={() => onChangePage('quote')}>
          📋 Quote Tool
        </NavTab>
        {isAdmin && (
          <NavTab active={activePage === 'admin'} onClick={() => onChangePage('admin')}>
            ⚙️ Admin
          </NavTab>
        )}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[#1a1f2b] border border-white/[0.06]">
          <Avatar firstName={profile?.first_name} lastName={profile?.last_name} className="w-[26px] h-[26px] text-[11px]" />
          <span className="text-[12px] font-medium text-[#94a3b8]">
            {profile?.first_name} {profile?.last_name?.[0]}.
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isAdmin ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' : 'bg-blue-400/10 text-blue-300 border border-blue-400/20'}`}>
            {isAdmin ? 'Admin' : 'Staff'}
          </span>
        </div>
        <button
          onClick={signOut}
          className="text-[11px] font-medium text-[#64748b] hover:text-[#e2e8f0] px-2.5 py-1.5 rounded border border-white/[0.06] bg-transparent cursor-pointer transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

function NavTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 text-[13px] font-medium border-b-2 cursor-pointer bg-transparent transition-colors whitespace-nowrap ${
        active
          ? 'text-[#e2e8f0] border-teal-400'
          : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
      }`}
    >
      {children}
    </button>
  )
}
