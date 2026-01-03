import Sidebar from '../components/Sidebar';
import AdminHeader from '../components/AdminHeader';
import SettingsPanel from '../components/SettingsPanel';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiHelper } from '../utils/apiHelper';

const Settings = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const userRole = localStorage.getItem('userRole') || user?.role;
      await apiHelper.get('/auth/logout');
      logout();
      if (userRole === 'SA') {
        navigate('/suprime/super-admin', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      const userRole = localStorage.getItem('userRole') || user?.role;
      logout();
      if (userRole === 'SA') {
        navigate('/suprime/super-admin', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  };

  const handleNavigation = (tab) => {
    switch (tab) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'games':
        navigate('/games');
        break;
      case 'panels':
        navigate('/panels');
        break;
      case 'balance-logs':
        navigate('/balance-logs');
        break;
      case 'transaction-history':
        navigate('/transaction-history');
        break;
      case 'transaction-logs':
        navigate('/transaction-logs');
        break;
        case 'tier-management':
        navigate('/tier-management');
        break;
      case 'telegram-otp':
        navigate('/telegram-otp');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab="settings" setActiveTab={handleNavigation} onLogout={handleLogout} />
      
      <div className="flex-1 lg:ml-64">
        <AdminHeader 
          title="System Settings" 
          subtitle="Configure system settings and preferences" 
        />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
};

export default Settings;