import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MembersList from './pages/MembersList';
import PlansList from './pages/PlansList';
import SubscriptionsList from './pages/SubscriptionsList';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/miembros" element={<MembersList />} />
                    <Route
                      path="/reportes"
                      element={
                        <ProtectedRoute requireAdmin>
                          <Reports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/planes"
                      element={
                        <ProtectedRoute requireAdmin>
                          <PlansList />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/suscripciones" element={<SubscriptionsList />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;