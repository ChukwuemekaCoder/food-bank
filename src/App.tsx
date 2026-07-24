import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardLayout } from '@/pages/DashboardLayout'
import { DonorsPage } from '@/pages/DonorsPage'
import { DonorDetailPage } from '@/pages/DonorDetailPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { VolunteersPage } from '@/pages/VolunteersPage'
import { RoutesPage } from '@/pages/RoutesPage'
import { RecipientsPage } from '@/pages/RecipientsPage'
import { NotificationsPage } from '@/pages/NotificationsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard/donors" replace />} />
                <Route path="donors" element={<DonorsPage />} />
                <Route path="donors/:id" element={<DonorDetailPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="volunteers" element={<VolunteersPage />} />
                <Route path="routes" element={<RoutesPage />} />
                <Route path="recipients" element={<RecipientsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
