import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const BottomNavigation = ({ activePage }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-[900px] mx-auto rounded-t-2xl border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around !!py-2 px-4 w-full max-w-[900px] mx-auto">
          {/* Home */}
          <button 
            onClick={() => navigate('/user-dashboard')}
            className={`flex flex-col items-center py-2 px-2 sm:px-3 transition-colors flex-1 ${
              activePage === 'home' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>
          
          {/* IDs */}
          <button 
            onClick={() => navigate('/my-ids')}
            className={`flex flex-col items-center py-2 px-2 sm:px-3 transition-colors flex-1 ${
              activePage === 'ids' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-xs font-medium">IDs</span>
          </button>
          
          {/* Passbook */}
          <button 
            onClick={() => navigate('/passbook')}
            className={`flex flex-col items-center py-2 px-2 sm:px-3 transition-colors flex-1 ${
              activePage === 'passbook' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
            </svg>
            <span className="text-xs font-medium">Passbook</span>
          </button>
          
          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center py-2 px-2 sm:px-3 text-gray-600 hover:text-red-600 transition-colors flex-1"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v2h8v-2H4z"/>
            </svg>
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </div>
      
      {/* Bottom padding to prevent content overlap */}
      <div className="h-16"></div>
    </>
  );
};

export default BottomNavigation;