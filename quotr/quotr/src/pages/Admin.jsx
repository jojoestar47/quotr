import { useState } from 'react'
import AdminProducts from '../components/AdminProducts'
import AdminQuotes from '../components/AdminQuotes'
import AdminUsers from '../components/AdminUsers'
import AdminSettings from '../components/AdminSettings'

const SECTIONS = [
  { id: 'products', icon: '📦', label: 'Products',      group: 'Catalogue' },
  { id: 'quotes',   icon: '📋', label: 'Quote History', group: 'Quotes'    },
  { id: 'users',    icon: '👥', label: 'Users',         group: 'Team'      },
  { id: 'settings', icon: '⚙️', label: 'Settings',      group: 'System'    },
]

export default function Admin() {
  const [activeSection, setActiveSection] = useState('products')

  const groups = [...new Set(SECTIONS.map(s => s.group))]

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <nav className="w-[210px] shrink-0 bg-[#13171f] border-r border-white/[0.06] py-4 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
        {groups.map(group => (
          <div key={group}>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#64748b] px-2.5 pt-4 pb-2 first:pt-0">
              {group}
            </div>
            {SECTIONS.filter(s => s.group === group).map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer border-none bg-transparent text-left transition-all ${
                  activeSection === s.id
                    ? 'bg-teal-400/10 text-teal-300'
                    : 'text-[#94a3b8] hover:bg-white/[0.03] hover:text-[#e2e8f0]'
                }`}
              >
                <span className="text-[15px]">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-7 bg-[#0c0f16]">
        {activeSection === 'products' && <AdminProducts />}
        {activeSection === 'quotes'   && <AdminQuotes />}
        {activeSection === 'users'    && <AdminUsers />}
        {activeSection === 'settings' && <AdminSettings />}
      </div>
    </div>
  )
}
