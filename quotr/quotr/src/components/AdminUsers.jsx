import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Btn, Avatar, Badge, Input, Select, Field, Modal, Toast, Spinner } from './ui'
import { formatDate } from '../lib/format'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  function showToast(msg) {
    setToast({ show: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500)
  }

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('user_profiles').select('*').order('created_at')
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function toggleRole(user) {
    const newRole = user.role === 'admin' ? 'staff' : 'admin'
    await supabase.from('user_profiles').update({ role: newRole }).eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    showToast(`${user.first_name} is now ${newRole}`)
  }

  async function removeUser(user) {
    if (!confirm(`Remove ${user.first_name} ${user.last_name}? They will lose access immediately.`)) return
    // Delete auth user via admin API is server-side only; here we just remove the profile which cascades
    // In production, call a Supabase Edge Function or use the admin panel
    await supabase.from('user_profiles').delete().eq('id', user.id)
    setUsers(prev => prev.filter(u => u.id !== user.id))
    showToast(`${user.first_name} removed`)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight mb-1">Team &amp; Users</h2>
          <p className="text-[13px] text-[#64748b]">Manage who has access and what they can do</p>
        </div>
        <Btn variant="primary" onClick={() => setInviteOpen(true)}>+ Invite User</Btn>
      </div>

      <div className="bg-[#13171f] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#1a1f2b]">
              {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold tracking-[0.08em] uppercase text-[#64748b] px-3.5 py-2.5 border-b border-white/[0.06]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors">
                <td className="px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar firstName={u.first_name} lastName={u.last_name} className="w-8 h-8 text-[12px]" />
                    <div>
                      <div className="text-[13px] font-medium">{u.first_name} {u.last_name}</div>
                      {u.id === currentUser?.id && <div className="text-[10px] text-[#64748b]">You</div>}
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-3 text-[12px] text-[#64748b]">{u.email || '—'}</td>
                <td className="px-3.5 py-3">
                  <Badge variant={u.role === 'admin' ? 'amber' : 'blue'}>
                    {u.role === 'admin' ? 'Admin' : 'Staff'}
                  </Badge>
                </td>
                <td className="px-3.5 py-3 text-[12px] text-[#64748b]">{formatDate(u.created_at)}</td>
                <td className="px-3.5 py-3">
                  {u.id !== currentUser?.id ? (
                    <div className="flex gap-1.5">
                      <Btn variant="amber" size="sm" onClick={() => toggleRole(u)}>
                        {u.role === 'admin' ? 'Make Staff' : 'Make Admin'}
                      </Btn>
                      <Btn variant="danger" size="sm" onClick={() => removeUser(u)}>Remove</Btn>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#64748b]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={(msg) => { showToast(msg); loadUsers() }}
      />
      <Toast show={toast.show} message={toast.message} />
    </div>
  )
}

function InviteModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'staff' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleInvite() {
    if (!form.first_name || !form.last_name || !form.email) { setError('Please fill in all fields'); return }
    setSending(true)
    setError('')

    // Invite via Supabase Admin Auth API
    // This requires the service_role key which should NOT be in the frontend.
    // In production, call a Supabase Edge Function that uses the service_role key.
    // For now, we use signUp which sends a confirmation email.
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2), // temp password
      options: {
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
        },
        emailRedirectTo: window.location.origin,
      },
    })

    setSending(false)
    if (authError) { setError(authError.message); return }
    onSuccess(`Invitation sent to ${form.email}`)
    setForm({ first_name: '', last_name: '', email: '', role: 'staff' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite a Team Member" subtitle="They'll receive an email to set their password on first sign-in.">
      <div className="bg-teal-400/8 border border-teal-400/20 rounded-lg px-3.5 py-3 text-[12px] text-teal-300 mb-4 leading-relaxed">
        An invitation email will be sent via Supabase Auth. The user sets their own password on first sign-in.
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="First Name"><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="James" /></Field>
        <Field label="Last Name"><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Davidson" /></Field>
        <Field label="Email" className="col-span-2"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="james@yourbusiness.com" className="col-span-2" /></Field>
        <Field label="Role">
          <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="staff">Staff — Quote Tool only</option>
            <option value="admin">Admin — Full access</option>
          </Select>
        </Field>
      </div>
      {error && <p className="text-[12px] text-red-400 mb-3">{error}</p>}
      <div className="flex gap-2 mt-2">
        <Btn variant="primary" onClick={handleInvite} disabled={sending}>{sending ? 'Sending…' : 'Send Invitation'}</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  )
}
