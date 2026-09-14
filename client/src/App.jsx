import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Reviews from './pages/Reviews.jsx';

import DashboardCustomer from './pages/DashboardCustomer.jsx';
import DashboardArtisan from './pages/DashboardArtisan.jsx';
import DashboardAdmin from './pages/DashboardAdmin.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/reviews" element={<Reviews />} />

        <Route
          path="/dashboard/customer"
          element={
            <ProtectedRoute roles={['customer']}>
              <DashboardCustomer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/artisan"
          element={
            <ProtectedRoute roles={['artisan']}>
              <DashboardArtisan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}