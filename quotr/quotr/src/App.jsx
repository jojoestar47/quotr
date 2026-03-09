import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import QuoteTool from './pages/QuoteTool'
import Admin from './pages/Admin'
import Topbar from './components/Topbar'
import { Spinner } from './components/ui'

function AppShell() {
  const { user, loading, isAdmin } = useAuth()
  const [activePage, setActivePage] = useState('quote')

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0c0f16]">
        <Spinner />
      </div>
    )
  }

  if (!user) return <Login />

  // If a staff member somehow navigates to admin, redirect back
  const page = (!isAdmin && activePage === 'admin') ? 'quote' : activePage

  return (
    <>
      <Topbar activePage={page} onChangePage={setActivePage} />
      {page === 'quote' && <QuoteTool />}
      {page === 'admin' && isAdmin && <Admin />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
