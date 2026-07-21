import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import OrganizerPanel from './pages/OrganizerPanel'
import EventFormPage from './pages/EventFormPage'
import RegistrantsPage from './pages/RegistrantsPage'
import CheckInPage from './pages/CheckInPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />

          {/* Public — no token required, per section 2.6. */}
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Any signed-in user. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bookings/:id" element={<BookingConfirmationPage />} />
          </Route>

          {/* Organisers only. */}
          <Route element={<ProtectedRoute requireOrganizer />}>
            <Route path="/organizer" element={<OrganizerPanel />} />
            <Route path="/organizer/events/new" element={<EventFormPage />} />
            <Route
              path="/organizer/events/:id/edit"
              element={<EventFormPage />}
            />
            <Route
              path="/organizer/events/:id/registrants"
              element={<RegistrantsPage />}
            />
            <Route path="/organizer/check-in" element={<CheckInPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
