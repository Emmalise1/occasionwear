import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { RootLayout } from './layouts/RootLayout'
import { RequireAdmin, RequireAuth } from './routes/guards'
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminReturnsPage } from './pages/admin/AdminReturnsPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyBookingsPage } from './pages/MyBookingsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OutfitDetailPage } from './pages/OutfitDetailPage'
import { OutfitsPage } from './pages/OutfitsPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="outfits" element={<OutfitsPage />} />
        <Route path="outfits/:id" element={<OutfitDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="my-bookings"
          element={
            <RequireAuth>
              <MyBookingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>

      <Route
        path="admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="returns" element={<AdminReturnsPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>
    </Routes>
  )
}
