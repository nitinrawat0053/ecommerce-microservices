import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyPhone from './pages/auth/VerifyPhone';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import AdminProductList from './pages/admin/AdminProductList';
import AdminProductForm from './pages/products/AdminProductForm';
import CartView from './pages/cart/CartView';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import CreateOrder from './pages/orders/CreateOrder';
import PaymentHistory from './pages/payments/PaymentHistory';
import PaymentVerify from './pages/payments/PaymentVerify';
import Profile from './pages/user/Profile';
import Wishlist from './pages/user/Wishlist';
import NotificationPreferences from './pages/user/NotificationPreferences';
import SuperAdminUserManagement from './pages/admin/SuperAdminUserManagement';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import SuperAdminCategories from './pages/admin/SuperAdminCategories';
import SuperAdminBrands from './pages/admin/SuperAdminBrands';
import SuperAdminInsights from './pages/admin/SuperAdminInsights';
import SuperAdminActivityLogs from './pages/admin/SuperAdminActivityLogs';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCustomers from './pages/admin/AdminCustomers';

function AuthRoutes() {
  const { token } = useAuth();
  if (token) return <Navigate to="/" replace />;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-phone" element={<VerifyPhone />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { token, isSuperAdmin } = useAuth();
  if (!token) return <AuthRoutes />;

  // Super Admin: admin layout with sidebar for ALL routes including homepage
  if (isSuperAdmin) {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProductList /></ProtectedRoute>} />
          <Route path="/admin/products/new" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><SuperAdminUserManagement /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><SuperAdminCategories /></ProtectedRoute>} />
          <Route path="/admin/brands" element={<ProtectedRoute><SuperAdminBrands /></ProtectedRoute>} />
          <Route path="/admin/insights" element={<ProtectedRoute><SuperAdminInsights /></ProtectedRoute>} />
          <Route path="/admin/activity-logs" element={<ProtectedRoute><SuperAdminActivityLogs /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin/products/:id/edit" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/profile/notifications" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  // Regular user (ADMIN gets admin layout with sidebar)
  const { isAdmin } = useAuth();
  
  if (isAdmin) {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProductList /></ProtectedRoute>} />
          <Route path="/admin/products/new" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><SuperAdminUserManagement /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><SuperAdminCategories /></ProtectedRoute>} />
          <Route path="/admin/brands" element={<ProtectedRoute><SuperAdminBrands /></ProtectedRoute>} />          <Route path="/admin/insights" element={<ProtectedRoute><SuperAdminInsights /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin/products/:id/edit" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }


  // Regular customer
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/admin/products" element={<ProtectedRoute><AdminProductList /></ProtectedRoute>} />
        <Route path="/admin/products/new" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><SuperAdminUserManagement /></ProtectedRoute>} />
        <Route path="/admin/products/:id/edit" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
      </Route>

      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<ProtectedRoute><CartView /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
        <Route path="/orders/new" element={<ProtectedRoute><CreateOrder /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
        <Route path="/payments/verify" element={<ProtectedRoute><PaymentVerify /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/profile/notifications" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
        <AppRoutes />
        </WishlistProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 3000,
            style: { zIndex: 9999 },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
