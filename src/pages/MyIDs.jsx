import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiHelper } from '../utils/apiHelper';
import { useToastContext } from '../App';
import PasswordInput from '../components/PasswordInput';
import { Gamepad2, Copy, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

const MyIDs = () => {
  const { user, logout } = useAuth(true);
  const { t } = useTranslation();
  const [subAccounts, setSubAccounts] = useState([]);
  const [subAccountsLoading, setSubAccountsLoading] = useState(false);
  const [selectedSubUser, setSelectedSubUser] = useState(null);
  const [showSubUserWithdraw, setShowSubUserWithdraw] = useState(false);
  const [showSubUserDeposit, setShowSubUserDeposit] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '' });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [subUserWithdrawForm, setSubUserWithdrawForm] = useState({ amount: '', selectedBankId: '' });
  const [subUserDepositForm, setSubUserDepositForm] = useState({ amount: '' });
  const [subUserBalance, setSubUserBalance] = useState(0);
  const [subUserBalanceLoading, setSubUserBalanceLoading] = useState(false);
  const [transactionProcessing, setTransactionProcessing] = useState(false);
  const [savedBanks, setSavedBanks] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const toast = useToastContext();

  const fetchSubAccounts = async () => {
    setSubAccountsLoading(true);
    try {
      const response = await apiHelper.get('/subAccount/getSubAccounts?page=1&limit=50');
      const accountsList = response?.subAccounts || response?.data || response || [];
      setSubAccounts(accountsList);
    } catch (error) {
      console.error('Failed to fetch sub accounts:', error);
      toast.error('Failed to fetch sub accounts: ' + error.message);
    } finally {
      setSubAccountsLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const userId = user?._id;
      if (!userId) return;
      const balanceResponse = await apiHelper.get(`/transaction/get_MainUserBalance/${userId}`);
      setUserBalance(balanceResponse?.data?.balance || 0);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setUserBalance(0);
    }
  };

  const createBalanceLog = async (userId) => {
    try {
      await apiHelper.post('/balance/createBalanceLog', { userId });
    } catch (error) {
      console.error('Failed to create balance log:', error);
    }
  };

  const fetchSubUserBalance = async (subAccountId) => {
    setSubUserBalanceLoading(true);
    try {
      const response = await apiHelper.get(`/balance/getBalanceLogBySubUserId/${subAccountId}`);
      const logData = response?.data || response || [];
      const latestLog = Array.isArray(logData) ? logData[0] : logData;

      if (latestLog?.status === 'Accept') {
        setSubUserBalance(latestLog?.CurrentBalance || 0);
        const payload = {
          amount: latestLog?.CurrentBalance,
          subUserId: subAccountId
        }
        // await apiHelper.post('/transaction/update_sub_user_balance', payload);
        setSubUserBalanceLoading(false);
      } else {
        setTimeout(() => fetchSubUserBalance(subAccountId));
      }
    } catch (error) {
      console.error('Failed to fetch sub-user balance:', error);
      setSubUserBalance(0);
      setSubUserBalanceLoading(false);
    }
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const commonPasswords = ['Abcd@1234', 'Password@123', 'Admin@123', 'Test@1234', 'User@1234'];
    const hasSequentialPattern = /abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/i.test(password);
    return regex.test(password) && !commonPasswords.includes(password) && !hasSequentialPattern;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetPasswordLoading(true);

    try {
      if (resetPasswordForm.newPassword.includes(' ')) {
        toast.error('Password cannot contain spaces');
        setResetPasswordLoading(false);
        return;
      }

      if (!validatePassword(resetPasswordForm.newPassword)) {
        toast.error('Password must contain 8+ characters with 1 uppercase, 1 lowercase, 1 number, 1 special character. Avoid common passwords and sequential patterns');
        setResetPasswordLoading(false);
        return;
      }

      const payload = {
        subUserId: selectedSubUser?.id || selectedSubUser?._id,
        clientName: selectedSubUser?.clientName,
        newPassword: resetPasswordForm.newPassword
      };

      await apiHelper.post('/password/create-password-change-log', payload);
      toast.success('Password reset request submitted successfully!');
      setResetPasswordLoading(false);
      setShowResetPassword(false);
      setResetPasswordForm({ newPassword: '' });
      setSelectedSubUser(null);
    } catch (error) {
      toast.error('Failed to reset password: ' + error.message);
      setResetPasswordLoading(false);
    }
  };

  const handleSubUserDeposit = async (e) => {
    e.preventDefault();
    setTransactionProcessing(true);

    try {
      const payload = {
        subUserId: selectedSubUser?.id || selectedSubUser?._id,
        amount: parseFloat(subUserDepositForm.amount),
        mode: 'Wallet',
        role: 'SubUser'
      };

      await apiHelper.post('/transaction/depositAmountRequest_ForSubUser', payload);
      toast.success('Deposit request submitted successfully!');
      setShowSubUserDeposit(false);
      setSubUserDepositForm({ amount: '' });
      setSelectedSubUser(null);
      fetchUserBalance();
    } catch (error) {
      toast.error('Failed to submit deposit request: ' + error.message);
    } finally {
      setTransactionProcessing(false);
    }
  };

  const handleSubUserWithdraw = async (e) => {
    e.preventDefault();
    setTransactionProcessing(true);

    try {
      const payload = {
        subUserId: selectedSubUser?.id || selectedSubUser?._id,
        amount: parseFloat(subUserWithdrawForm.amount),
        mode: 'Wallet',
        role: 'SubUser'
      };

      await apiHelper.post('/transaction/withdrawAmountRequest_ForSubUser', payload);
      toast.info('Withdrawal request submitted successfully please check history!');
      setShowSubUserWithdraw(false);
      setSubUserWithdrawForm({ amount: '', selectedBankId: '' });
      setSelectedSubUser(null);
      fetchUserBalance();
    } catch (error) {
      toast.error('Failed to submit withdrawal request: ' + error.message);
    } finally {
      setTransactionProcessing(false);
    }
  };

  useEffect(() => {
    fetchSubAccounts();
    fetchUserBalance();
  }, []);

  return (
    <div className="min-h-screen max-w-[900px] mx-auto bg-gray-50">
      {/* Main Content */}
      <div className="px-4 pb-20 pt-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('myIds')} ({subAccounts.length})</h1>
              <p className="text-gray-600 text-sm mt-1">{t('manageAccounts')}</p>
            </div>
            <LanguageSelector />
          </div>
        </div>

        {/* IDs Grid */}
        {subAccountsLoading ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto mb-4" style={{ width: '32px', height: '32px' }}></div>
            <p className="text-gray-600">{t('loading')}...</p>
          </div>
        ) : subAccounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-base sm:text-lg mb-2">No sub accounts found</p>
            <p className="text-sm">Create your first sub account from the home page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subAccounts.map((account, index) => {
              const game = account.gameId?.name;
              return (
                <div key={account.id || account._id || index} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 sm:p-6 text-white shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1477b0' }}>
                        {game?.image ? (
                          <img src={game.image} alt={game.name} className="w-6 h-6 sm:w-8 sm:h-8 rounded" />
                        ) : (
                          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-lg notranslate">{game || 'Game'}</h3>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          account.status === "Accept"
                            ? "bg-green-100 text-green-800"
                            : account.status === "Panding"
                            ? "bg-yellow-100 text-yellow-800"
                            : account.status === "Reject"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {account.status === "Accept"
                          ? t('active')
                          : account.status === "Panding"
                          ? t('pending')
                          : account.status === "Reject"
                          ? t('rejected')
                          : t('pending')}
                      </span>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-xs">👤</span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300 notranslate">ID:</span>
                      <span className="text-xs sm:text-sm font-mono truncate notranslate">{account?.clientName || 'N/A'}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(account?.clientName || '');
                          toast.success('ID copied to clipboard!');
                        }}
                        className="ml-auto p-1 hover:bg-gray-700 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-xs">🔒</span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300 notranslate">{t('password')}:</span>
                      <span className="text-xs sm:text-sm font-mono truncate flex-1 notranslate">{account?.password || 'N/A'}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(account?.password || '');
                          toast.success('Password copied to clipboard!');
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                        title="Copy Password"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-xs">🌐</span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300 notranslate">{t('platform')}:</span>
                      <span className="text-xs sm:text-sm font-mono truncate">
                        <a href={account?.gameId?.gameUrl} target='_blank'>{account?.gameId?.gameUrl || 'N/A'}</a>
                      </span>
                      <button
                        onClick={() => {
                          if (account?.gameId?.gameUrl) {
                            window.open(account.gameId.gameUrl, '_blank');
                          } else {
                            toast.error('Platform URL not available');
                          }
                        }}
                        className="ml-auto p-1 hover:bg-gray-700 rounded"
                        title="Open Platform"
                      >
                        <span className="text-xs">🔗</span>
                      </button>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {account.status === "Reject" && account.remarks && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-white">!</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-300 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-200">{account.remarks}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedSubUser(account);
                        setShowSubUserDeposit(true);
                      }}
                      disabled={account.status !== "Accept"}
                      className={`flex-1 py-2 px-2 sm:px-4 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors ${
                        account.status === "Accept"
                          ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                          : 'bg-gray-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">{t('deposit')}</span>
                    </button>
                    <button
                      onClick={async () => {
                        setSelectedSubUser(account);
                        await createBalanceLog(account?.id || account?._id);
                        setShowSubUserWithdraw(true);
                        fetchSubUserBalance(account?.id || account?._id);
                      }}
                      disabled={account.status !== "Accept"}
                      className={`flex-1 py-2 px-2 sm:px-4 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors ${
                        account.status === "Accept"
                          ? 'cursor-pointer'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                      style={{ backgroundColor: account.status === "Accept" ? '#1477b0' : '#6b7280' }}
                    >
                      <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">{t('withdraw')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSubUser(account);
                        setShowResetPassword(true);
                      }}
                      disabled={account.status !== "Accept"}
                      className={`flex-1 py-2 px-2 sm:px-4 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors ${
                        account.status === "Accept"
                          ? 'cursor-pointer'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                      style={{ backgroundColor: account.status === "Accept" ? '#1477b0' : '#6b7280' }}
                      title="Reset Password"
                    >
                      <span className="text-xs sm:text-sm font-medium">{t('resetPassword')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>



      {/* Modals - Same as UserDashboard */}
      {/* Sub User Deposit Modal */}
      {showSubUserDeposit && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50">
          <div className="gaming-card p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('depositToSub')}</h2>
                <p className="text-gray-600 text-sm mt-1">ID: {selectedSubUser?.clientName || 'N/A'}</p>
                <div className="mt-2">
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-gray-700 font-medium text-sm">{t('availableBalance')}:</span>
                    <span className="text-lg font-bold" style={{ color: '#1477b0' }}>
                      ₹{userBalance}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSubUserDeposit(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubUserDeposit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">{t('amount')}</label>
                <input
                  type="number"
                  placeholder={t('enterAmount')}
                  value={subUserDepositForm.amount}
                  onChange={(e) => setSubUserDepositForm({ ...subUserDepositForm, amount: e.target.value })}
                  className="gaming-input"
                  required
                  min="1"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => setShowSubUserDeposit(false)} className="w-full sm:flex-1 btn-secondary">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={transactionProcessing} className="w-full sm:flex-1 gaming-btn">
                  {transactionProcessing ? t('processing') + '...' : t('deposit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub User Withdraw Modal */}
      {showSubUserWithdraw && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50">
          <div className="gaming-card p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('withdrawFromSub')}</h2>
                <p className="text-gray-600 text-sm mt-1">ID: {selectedSubUser?.clientName || 'N/A'}</p>
                <div className="mt-2">
                  {subUserBalanceLoading ? (
                    <div className="flex items-center gap-3 bg-green-50 px-3 py-2 rounded-xl shadow-sm">
                      <div className="w-5 h-5 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{t('balance')}</span>
                        <span className="text-sm text-gray-500 animate-pulse">{t('loading')}...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl shadow-sm">
                      <span className="text-gray-700 font-medium text-sm">{t('balance')}:</span>
                      <span className="text-lg font-bold text-green-600">
                        ₹{Number(subUserBalance).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setShowSubUserWithdraw(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {subUserBalanceLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4" style={{ width: '32px', height: '32px' }}></div>
                <p className="text-lg font-semibold text-gray-900 mb-2">{t('loadingBalance')}</p>
                <p className="text-sm text-gray-600">Please wait while we fetch the current balance</p>
              </div>
            ) : (
              <form onSubmit={handleSubUserWithdraw} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">{t('amount')}</label>
                  <input
                    type="number"
                    placeholder={t('enterAmount')}
                    value={subUserWithdrawForm.amount}
                    onChange={(e) => setSubUserWithdrawForm({ ...subUserWithdrawForm, amount: e.target.value })}
                    className="gaming-input"
                    required
                    min="1"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={() => setShowSubUserWithdraw(false)} className="w-full sm:flex-1 btn-secondary">
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={transactionProcessing} className="w-full sm:flex-1 gaming-btn">
                    {transactionProcessing ? t('processing') + '...' : t('withdraw')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50">
          <div className="gaming-card p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('resetPassword')}</h2>
                <p className="text-gray-600 text-sm mt-1">ID: {selectedSubUser?.clientName || 'N/A'}</p>
              </div>
              <button onClick={() => {
                setShowResetPassword(false);
                setResetPasswordForm({ newPassword: '' });
                setSelectedSubUser(null);
              }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {resetPasswordLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4" style={{ width: '32px', height: '32px' }}></div>
                <p className="text-lg font-semibold text-gray-900 mb-2">{t('processing')}...</p>
                <p className="text-sm text-gray-600">Please wait while we process your password reset</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">{t('newPassword')}</label>
                  <PasswordInput
                    name="newPassword"
                    placeholder="Example@1256"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                    className="gaming-input"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Must contain 8+ characters with 1 uppercase, 1 lowercase, 1 number, 1 special character. Avoid common passwords and sequential patterns</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={() => {
                    setShowResetPassword(false);
                    setResetPasswordForm({ newPassword: '' });
                    setSelectedSubUser(null);
                  }} className="w-full sm:flex-1 btn-secondary">
                    {t('cancel')}
                  </button>
                  <button type="submit" className="w-full sm:flex-1 gaming-btn">
                    {t('resetPassword')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <BottomNavigation activePage="ids" />
    </div>
  );
};

export default MyIDs;