import { NavLink } from 'react-router-dom'
import { Bell, Home, LogOut, Package, Route, UserCheck, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { to: '/dashboard/donors', label: 'Donors', icon: Users },
  { to: '/dashboard/inventory', label: 'Inventory', icon: Package },
  { to: '/dashboard/volunteers', label: 'Volunteers', icon: UserCheck },
  { to: '/dashboard/routes', label: 'Routes', icon: Route },
  { to: '/dashboard/recipients', label: 'Recipients', icon: Home },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
]

export function Sidebar() {
  const { logout } = useAuth()

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-white font-semibold text-lg">Food Bank</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
