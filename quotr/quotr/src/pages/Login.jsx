import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Input, Btn } from '../components/ui'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError('Incorrect email or password.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0f16] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[500px] top-[20%] left-[20%] bg-teal-400/5 rounded-full blur-[120px]" />
        <div className="absolute w-[400px] h-[400px] bottom-[10%] right-[15%] bg-amber-400/3 rounded-full blur-[100px]" />
      </div>
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%,black 0%,transparent 80%)' }}
      />

      <div className="relative z-10 w-[380px] bg-[#13171f] border border-white/10 rounded-2xl p-10 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white font-bold text-base shadow-[0_4px_16px_rgba(45,212,191,0.3)]">Q</div>
          <span className="text-xl font-bold tracking-tight">Quot<span className="text-teal-400">r</span></span>
        </div>

        <h1 className="text-[22px] font-semibold tracking-tight mb-1">Welcome back</h1>
        <p className="text-[13px] text-[#64748b] mb-7">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-[#64748b] mb-1.5">Email</label>
            <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoFocus />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-[#64748b] mb-1.5">Password</label>
            <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>

          {error && <p className="text-[12px] text-red-400 text-center">{error}</p>}

          <Btn variant="primary" size="lg" className="w-full mt-1" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Btn>
        </form>

        <p className="text-[11px] text-[#64748b] text-center mt-6 leading-relaxed">
          Don't have an account? Ask your admin to invite you.
        </p>
      </div>
    </div>
  )
}
