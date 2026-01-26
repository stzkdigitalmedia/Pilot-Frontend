import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Phone, MapPin, Building, CreditCard, Calendar, Shield, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { apiHelper } from '../utils/apiHelper';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const [transactionForm, setTransactionForm] = useState({ amount: '', transactionType: 'Deposit' });
  const [transactionProcessing, setTransactionProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [savedBanks, setSavedBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [banksLoading, setBanksLoading] = useState(false);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: ''
  });

  const fetchUserBalance = async () => {
    try {
      if (!user?._id) return;
      const response = await apiHelper.get(`/transaction/get_MainUserBalance/${user._id}`);
      if (response?.success) {
        setUserBalance(response?.data?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchSavedBanks = async () => {
    setBanksLoading(true);
    try {
      const userId = user?._id;
      if (!userId) return;
      const response = await apiHelper.get(`/bank/getAllBanksWithoutPagination/${userId}`);
      const banksList = response?.banks || response?.data || response || [];
      setSavedBanks(banksList);
    } catch (error) {
      console.error('Failed to fetch banks:', error);
      setSavedBanks([]);
    } finally {
      setBanksLoading(false);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setTransactionProcessing(true);

    try {
      const userId = user?._id;
      if (!userId) {
        toast.error('User not found');
        setTransactionProcessing(false);
        return;
      }

      let payload = {
        userId: userId,
        amount: parseFloat(transactionForm?.amount),
        transactionType: transactionForm?.transactionType === 'Withdraw' ? 'Withdrawal' : transactionForm?.transactionType,
        role: 'User',
        mode: 'PowerPay'
      };

      payload.branchUserName = 'Pbk1157';

      // Add bank details for withdraw transactions
      if (transactionForm?.transactionType === 'Withdraw') {
        if (selectedBankId === '') {
          toast.error('Please select a bank account for withdrawal');
          setTransactionProcessing(false);
          return;
        }
        const selectedBank = savedBanks[parseInt(selectedBankId)];
        if (selectedBank) {
          payload = {
            ...payload,
            upiId: selectedBank.upiId,
            bankName: selectedBank.bankName,
            accNo: selectedBank.accNo,
            accHolderName: selectedBank.accHolderName,
            ifscCode: selectedBank.ifscCode
          };
        }
      }

      const response = await apiHelper.post('/transaction/createTransaction', payload);

      if (response?.success && response?.data) {
        const transaction = response?.data;

        toast.success('Transaction created successfully!');
        setShowCreateTransaction(false);
        setTransactionForm({ amount: '', transactionType: 'Deposit' });
        setSelectedBankId('');

        fetchUserBalance();

        // Handle different transaction types
        if (transactionForm?.transactionType === 'Deposit') {
          //   // Show processing message
          toast.success('Processing payment... Please wait');
          setTimeout(() => {
            window.location.href = `http://powerdreams.org/online/pay/Pbk1157/${transaction?._id}?url=https://pilotplay.com`;
          }, 2000);


        } else if (transactionForm?.transactionType === 'Withdraw') {
          // Call external API for withdrawal
          const selectedBank = savedBanks[parseInt(selectedBankId)];
          if (selectedBank) {
            try {
              toast.success('Withdrawal request submitted successfully!');
            } catch (externalError) {
              console.log('External withdrawal API error:', externalError);
            }
          }
        }

        return;
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Failed to create transaction: ' + error.message);
    } finally {
      setTransactionProcessing(false);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    try {
      const userId = user?._id;
      if (!userId) {
        toast.error('User not found');
        return;
      }

      const payload = {
        userId: userId,
        upiId: bankForm.upiId,
        bankName: bankForm.bankName,
        accNo: bankForm.accountNumber,
        accHolderName: bankForm.accountHolderName,
        ifscCode: bankForm.ifscCode,
        isActive: true
      };

      await apiHelper.post('/bank/addBank', payload);
      toast.success('Bank added successfully!');
      setBankForm({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', upiId: '' });
      setShowAddBankModal(false);
      fetchSavedBanks();
    } catch (error) {
      toast.error('Failed to add bank: ' + error.message);
    }
  };

  const handleDeleteBank = async (bankId) => {
    try {
      const response = await apiHelper.delete(`/user/deleteBank/${bankId}`);
      if (response?.success) {
        toast.success('Bank account deleted successfully');
        fetchSavedBanks();
      }
    } catch (error) {
      toast.error('Failed to delete bank account');
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchUserBalance();
    }
  }, [user]);

  useEffect(() => {
    if (showCreateTransaction && transactionForm?.transactionType === 'Withdraw') {
      fetchSavedBanks();
    }
  }, [showCreateTransaction, transactionForm?.transactionType]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Show loading if user data is not available
  if (!user) {
    return (
      <div className="h-screen bg-[#0e0e0e] max-w-[769px] mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" style={{ width: '40px', height: '40px' }}></div>
          <p className="text-gray-600 text-lg">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] max-w-[769px] mx-auto">

      <div className="p-4 sm:p-6 lg:p-8 pt-5 lg:pt-6 bg-[#0e0e0e]  max-w-[769px] mx-auto">
        {/* Profile Header */}
        <div className="bg-[#1b1b1b] p-4 mb-1">
          <div className='flex justify-between items-centers align-middle'>
            <div className="flex flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center mx-auto justify-center text-white font-bold text-lg bg-gray-800">
                {user?.clientName?.charAt(0).toUpperCase() || user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-lg font-bold text-white">{user?.clientName || 'username'}</h1>
                <div className="flex items-center justify-start gap-2">
                  <span className={`px-2 rounded-full text-[12px] font-medium ${user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {user?.isActive ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button className='bg-[#197fed] text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hidden sm:block' onClick={handleLogout}>
                Logout
              </button>
            </div>
            <div className='sm:hidden block'>
              <p className="text-[12px] text-gray-300">{t('balance')}</p>
              <p className="font-medium text-[18px] leading-none text-green-600">₹{user?.balance?.toLocaleString() || '0'}</p>
            </div>
          </div>
          <div className='p-2 mt-2'>
            <div>
              {/* <p className="hidden text-[12px] text-gray-300">{t('balance')}</p>
              <p className="hidden font-medium text-[18px] leading-none text-green-600">₹{user?.balance?.toLocaleString() || '0'}</p> */}
              <div className='grid grid-cols-2 gap-4 mt-4'>
                <button
                  onClick={() => {
                    setTransactionForm({ amount: '', transactionType: 'Deposit' });
                    setShowCreateTransaction(true);
                    fetchUserBalance();
                  }}
                  className='bg-green-600 px-4 py-1 rounded-lg text-white'
                >
                  Deposit
                </button>
                <button
                  onClick={() => {
                    setTransactionForm({ amount: '', transactionType: 'Withdraw' });
                    setShowCreateTransaction(true);
                    fetchUserBalance();
                  }}
                  className='bg-red-600 px-4 py-1 rounded-lg text-white'
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 mt-3 sm:mt-0 gap-1">
          {/* Personal Information */}
          <div className=" text-white px-2 py-0.5 sm:py-2">
            {/* <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-white" />
              {t('personalInformation')}
            </h2> */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-1 px-2 bg-[#1b1b1b] rounded-lg">
                <User className="w-5 h-5 text-white" />
                <div>
                  <p className="text-[12px] leading-none text-gray-300">{t('fullName')}</p>
                  <p className="font-medium text-[16px]">{user?.fullName || t('notProvided')}</p>
                </div>
              </div>

              <div className="flex items-center bg-[#1b1b1b] gap-3 p-1 px-2 rounded-lg">
                <Phone className="w-5 h-5" />
                <div>
                  <p className="text-[12px] leading-none text-gray-300">{t('phone')}</p>
                  <p className="font-medium text-[16px] ">{user?.phone || t('notProvided')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-1 px-2 bg-[#1b1b1b] rounded-lg">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="text-[12px] leading-none text-gray-300">{t('city')}</p>
                  <p className="font-medium text-[16px]">{user?.city || t('notProvided')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="text-white px-2 py-0.5 sm:py-2">
            {/* <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('accountInformation')}
            </h2> */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-1 px-2 bg-[#1b1b1b] rounded-lg">
                <Building className="w-5 h-5" />
                <div>
                  <p className="text-[12px] leading-none text-gray-300">{t('branch')}</p>
                  <p className="font-medium text-[16px]">{user?.branchName || t('notAssigned')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-1 px-2 bg-[#1b1b1b] rounded-lg">
                <CreditCard className="w-5 h-5" />
                <div className='hidden sm:block'>
                  <p className="text-[12px] leading-none text-gray-300">{t('balance')}</p>
                  <p className="font-medium text-[16px] text-green-600">₹{user?.balance?.toLocaleString() || '0'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-1 px-2 bg-[#1b1b1b] rounded-lg">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="text-[12px] leading-none text-gray-300">{t('memberSince')}</p>
                  <p className="font-medium text-[16px]">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('notAvailable')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Create Transaction Modal */}
      {showCreateTransaction && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[100]">
          <div className="gaming-card p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('requestTransaction')}</h2>
                <p className="text-gray-600 text-sm mt-1">{t('submitRequest')}</p>
                <div className="mt-2">
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-gray-700 font-medium text-sm">Available Balance:</span>
                    <span className="text-lg font-bold" style={{ color: '#1477b0' }}>
                      ₹{userBalance}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => {
                setShowCreateTransaction(false);
                fetchUserBalance();
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="form-group">
                <label className="form-label">
                  {transactionForm?.transactionType === 'Withdraw'
                    ? 'Amount (Minimum ₹500)'
                    : `${t('amount')} (${t('minimumAmount')})`
                  }
                </label>
                <input
                  type="number"
                  placeholder={
                    transactionForm?.transactionType === 'Withdraw'
                      ? 'Enter amount (min 500)'
                      : t('enterAmount')
                  }
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="gaming-input"
                  required
                  min={transactionForm?.transactionType === 'Withdraw'
                    ? "500"
                    : "100"}
                />
              </div>

              {transactionForm?.transactionType === 'Withdraw' && (
                <>
                  {banksLoading ? (
                    <div className="text-center py-4">
                      <div className="loading-spinner mx-auto mb-2" style={{ width: '20px', height: '20px' }}></div>
                      <p className="text-gray-600 text-sm">Loading banks...</p>
                    </div>
                  ) : savedBanks.length > 0 ? (
                    <div className="form-group">
                      <label className="form-label">{t('selectBankAccount')}</label>
                      <div className="space-y-3">
                        {savedBanks.map((bank, index) => (
                          <div
                            key={bank.id || bank._id || index}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedBankId === index.toString()
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                            onClick={() => setSelectedBankId(index.toString())}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="bankSelection"
                                value={index}
                                checked={selectedBankId === index.toString()}
                                onChange={() => setSelectedBankId(index.toString())}
                                className="text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{bank.bankName || 'Unknown Bank'}</div>
                                <div className="text-sm text-gray-600">Holder Name:{bank.accHolderName || 'Unknown Holder'}</div>
                                <div className="text-sm text-gray-500">A/C: {bank.accNo || 'N/A'}</div>
                                <div className="text-sm text-gray-500">IFSC: {bank.ifscCode || 'N/A'}</div>
                                {bank.upiId && <div className="text-sm text-gray-500">UPI: {bank.upiId}</div>}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBank(bank.id || bank._id);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete Bank Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No bank accounts found. Add your first bank account.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddBankModal(true)}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('addBank')}
                  </button>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" disabled={transactionProcessing} className="w-full sm:flex-1 gaming-btn">
                  {transactionProcessing ? (
                    <>{t('processing')}</>
                  ) : (
                    <>{t('requestTransactionBtn')}</>
                  )}
                </button>
                <button type="button" onClick={() => {
                  setShowCreateTransaction(false);
                  fetchUserBalance();
                }} className="w-full sm:flex-1 btn-secondary">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[110]">
          <div className="gaming-card p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('addBankDetails')}</h2>
                <p className="text-gray-600 text-sm mt-1">{t('saveBankForWithdrawals')}</p>
              </div>
              <button onClick={() => setShowAddBankModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-4">
              <div className="form-group">
                <label className="form-label">{t('upiId')}</label>
                <input
                  type="text"
                  placeholder={t('enterUpiId')}
                  value={bankForm.upiId}
                  onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                  className="gaming-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('bankName')}</label>
                <input
                  type="text"
                  placeholder={t('enterBankName')}
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="gaming-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('accountNumber')}</label>
                <input
                  type="text"
                  placeholder={t('enterAccountNumber')}
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="gaming-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('accountHolder')}</label>
                <input
                  type="text"
                  placeholder={t('enterAccountHolder')}
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  className="gaming-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('ifscCode')}</label>
                <input
                  type="text"
                  placeholder={t('enterIfscCode')}
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                  className="gaming-input"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" className="w-full sm:flex-1 gaming-btn">
                  {t('saveBank')}
                </button>
                <button type="button" onClick={() => setShowAddBankModal(false)} className="w-full sm:flex-1 btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Logout Button - Fixed at bottom */}
      <div className="fixed bottom-14 left-0 right-0 p-2 bg-[#0e0e0e] sm:hidden z-10">
        <div className="max-w-[769px] mx-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-[#197fed] text-white py-1.5 rounded-lg text-[16px] font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <BottomNavigation activePage="profile" />
    </div>
  );
};

export default UserProfile;