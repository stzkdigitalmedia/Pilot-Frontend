import { useAuth } from '../hooks/useAuth';
import { User, Phone, MapPin, Building, CreditCard, Calendar, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Show loading if user data is not available
  if (!user) {
    return (
      <div className="h-screen bg-gray-50 max-w-[900px] mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" style={{ width: '40px', height: '40px' }}></div>
          <p className="text-gray-600 text-lg">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 max-w-[900px] mx-auto">

      <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-[900px] mx-auto">
        {/* Profile Header */}
        <div className="gaming-card p-6 mb-6">
          <div className='flex justify-between items-centers align-middle'>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl" style={{ backgroundColor: '#1477b0' }}>
                {user?.clientName?.charAt(0).toUpperCase() || user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-900">{user?.fullName || 'User'}</h1>
                <p className="text-gray-600 text-lg">@{user?.clientName || 'username'}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {user?.isActive ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>
            </div>
            <div className="">
              <LanguageSelector />
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="gaming-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: '#1477b0' }} />
              {t('personalInformation')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('fullName')}</p>
                  <p className="font-medium text-gray-900">{user?.fullName || t('notProvided')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('phone')}</p>
                  <p className="font-medium text-gray-900">{user?.phone || t('notProvided')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('city')}</p>
                  <p className="font-medium text-gray-900">{user?.city || t('notProvided')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="gaming-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: '#1477b0' }} />
              {t('accountInformation')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('branch')}</p>
                  <p className="font-medium text-gray-900">{user?.branchName || t('notAssigned')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('balance')}</p>
                  <p className="font-medium text-green-600">₹{user?.balance?.toLocaleString() || '0'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('memberSince')}</p>
                  <p className="font-medium text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('notAvailable')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* Bottom padding to prevent content overlap */}
      <div className="h-16"></div>
      <BottomNavigation activePage="profile" />
    </div>
  );
};

export default UserProfile;