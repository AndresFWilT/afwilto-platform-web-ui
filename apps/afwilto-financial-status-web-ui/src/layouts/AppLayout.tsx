import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function AppLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-dark-900">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-56 z-40
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <Sidebar onClose={() => setOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:pl-56 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-dark-800 border-b border-border sticky top-0 z-20">
          <button
            onClick={() => setOpen(true)}
            className="text-text-secondary hover:text-primary-400 transition-colors p-1"
          >
            <Menu size={20} />
          </button>
          <span className="text-primary-400 font-bold text-lg text-glow-primary">FinStatus</span>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
