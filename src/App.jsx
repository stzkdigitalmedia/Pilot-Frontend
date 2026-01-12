import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import SimpleRegister from './pages/SimpleRegister';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Settings from './pages/Settings';
import PanelManagementPage from './pages/PanelManagement';
import UserDashboard from './pages/UserDashboard';
import SubAccounts from './pages/SubAccounts';
import MyIDs from './pages/MyIDs';
import IDDetails from './pages/IDDetails';
import LandingPage from './pages/LandingPage';

import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import UserRoute from './components/UserRoute';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { createContext, useContext } from 'react';
import './App.css'
import UserProfile from './pages/UserProfile';
import StatusDetails from './pages/StatusDetails';
import UserRegistrations from './pages/UserRegistrations';
import NoTransactionUsers from './pages/NoTransactionUsers';
import DepositTransactions from './pages/DepositTransactions';
import WithdrawalTransactions from './pages/WithdrawalTransactions';
import AllTransactions from './pages/AllTransactions';
import ManualBalanceLogsPage from './pages/ManualBalanceLogsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import DeleteLogs from './pages/DeleteLogs';
import TransactionLogsPage from './pages/TransactionLogsPage';
import TodayDepositRequests from './pages/TodayDepositRequests';
import TodayWithdrawalRequests from './pages/TodayWithdrawalRequests';
import TelegramOTP from './pages/TelegramOTP';
// import TierManagement from './pages/TierManagement';
// import TierDetails from './pages/TierDetails';
import Passbook from './pages/Passbook';
import WhatsAppButton from './components/WhatsAppButton';
import { useAuth } from './hooks/useAuth';

const ToastContext = createContext();

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};

function AppContent() {
  const toast = useToast();
  const location = useLocation();
  // const { user } = location.pathname === '/' ? { user: null } : useAuth(true);
  const { user } = useAuth(true);
  const hideOnRoutes = ['/my-ids', '/passbook', '/profile', '/id-details'];

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ToastContext.Provider value={toast}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/suprime/super-admin" element={<AdminLogin />} />
        <Route path="/register" element={<SimpleRegister />} />
        <Route path="/dashboard" element={
          <SuperAdminRoute>
            <Dashboard />
          </SuperAdminRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/games" element={
          <SuperAdminRoute>
            <Games />
          </SuperAdminRoute>
        } />
        <Route path="/settings" element={
          <SuperAdminRoute>
            <Settings />
          </SuperAdminRoute>
        } />
        <Route path="/panels" element={
          <SuperAdminRoute>
            <PanelManagementPage />
          </SuperAdminRoute>
        } />
        <Route path="/status-details" element={
          <ProtectedRoute>
            <StatusDetails />
          </ProtectedRoute>
        } />
        <Route path="/user-registrations" element={
          <ProtectedRoute>
            <UserRegistrations />
          </ProtectedRoute>
        } />
        <Route path="/no-transaction-users" element={
          <ProtectedRoute>
            <NoTransactionUsers />
          </ProtectedRoute>
        } />
        <Route path="/deposit-transactions" element={
          <ProtectedRoute>
            <DepositTransactions />
          </ProtectedRoute>
        } />
        <Route path="/withdrawal-transactions" element={
          <ProtectedRoute>
            <WithdrawalTransactions />
          </ProtectedRoute>
        } />
        <Route path="/all-transactions" element={
          <ProtectedRoute>
            <AllTransactions />
          </ProtectedRoute>
        } />
        <Route path="/balance-logs" element={
          <SuperAdminRoute>
            <ManualBalanceLogsPage />
          </SuperAdminRoute>
        } />
        <Route path="/transaction-history" element={
          <SuperAdminRoute>
            <TransactionHistoryPage />
          </SuperAdminRoute>
        } />
        <Route path="/transaction-logs" element={
          <SuperAdminRoute>
            <TransactionLogsPage />
          </SuperAdminRoute>
        } />
        <Route path="/delete-logs" element={
          <SuperAdminRoute>
            <DeleteLogs />
          </SuperAdminRoute>
        } />
        <Route path="/today-deposit-requests" element={
          <SuperAdminRoute>
            <TodayDepositRequests />
          </SuperAdminRoute>
        } />
        <Route path="/today-withdrawal-requests" element={
          <SuperAdminRoute>
            <TodayWithdrawalRequests />
          </SuperAdminRoute>
        } />
        {/* <Route path="/tier-management" element={
          <SuperAdminRoute>
            <TierManagement />
          </SuperAdminRoute>
        } />
        <Route path="/tier-details/:tierId" element={
          <SuperAdminRoute>
            <TierDetails />
          </SuperAdminRoute>
        } /> */}
        <Route path="/telegram-otp" element={
          <SuperAdminRoute>
            <TelegramOTP />
          </SuperAdminRoute>
        } />
        <Route path="/user-dashboard" element={
          <UserRoute>
            <UserDashboard />
          </UserRoute>
        } />
        <Route path="/my-ids" element={
          <UserRoute>
            <MyIDs />
          </UserRoute>
        } />
        <Route path="/id-details/:subaccid" element={
          <UserRoute>
            <IDDetails />
          </UserRoute>
        } />
        <Route path="/passbook" element={
          <UserRoute>
            <Passbook />
          </UserRoute>
        } />
        <Route path="/sub-accounts" element={
          <ProtectedRoute>
            <SubAccounts />
          </ProtectedRoute>
        } />
        {/* <Route path="/" element={<LandingPage />} /> */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      {
        user?.role !== 'SA' && !hideOnRoutes.some(route => location.pathname.startsWith(route)) && (
          <WhatsAppButton />
        )
      }
    </ToastContext.Provider>
  );
}

function App() {
  return (
    <div className='bg-gray-950'>
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App