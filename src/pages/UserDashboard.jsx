import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiHelper } from '../utils/apiHelper';
import { useToastContext } from '../App';
import PasswordInput from '../components/PasswordInput';
import PhoneInput from '../components/PhoneInput';
import { Wallet, Plus, BarChart3, Gamepad2, X, Check, Trash2, ChevronLeft, ChevronRight, Copy, ArrowUp, ArrowDown, Link2, LinkIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

const UserDashboard = () => {
  const { user, logout } = useAuth(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showCreateId, setShowCreateId] = useState(false);
  const [games, setGames] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subAccountsLoading, setSubAccountsLoading] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const [transactionProcessing, setTransactionProcessing] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    transactionType: 'Deposit',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [savedBanks, setSavedBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: ''
  });
  const [showSubUserWithdraw, setShowSubUserWithdraw] = useState(false);
  const [selectedSubUser, setSelectedSubUser] = useState(null);
  const [subUserWithdrawForm, setSubUserWithdrawForm] = useState({
    amount: '',
    selectedBankId: ''
  });
  const [subUserBalance, setSubUserBalance] = useState(0);
  const [subUserBalanceLoading, setSubUserBalanceLoading] = useState(false);
  const [showSubUserDeposit, setShowSubUserDeposit] = useState(false);
  const [subUserDepositForm, setSubUserDepositForm] = useState({
    amount: ''
  });
  const [showBalanceLog, setShowBalanceLog] = useState(false);
  const [balanceLogData, setBalanceLogData] = useState([]);
  const [balanceLogLoading, setBalanceLogLoading] = useState(false);
  const [idCreated, setIdCreated] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [updatedTransactions, setUpdatedTransactions] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '' });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [walletFilters, setWalletFilters] = useState({
    status: '',
    transactionType: '',
    minAmount: '',
    maxAmount: ''
  });

  const [accountToDelete, setAccountToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);


  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [formData, setFormData] = useState({
    gameId: '',
    clientName: '',
    password: '',
    phone: ''
  });
  const toast = useToastContext();

  // Touch handlers for swipe functionality
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      // Swipe left - go to next slide
      const step = window.innerWidth >= 640 ? 2 : 1;
      const maxSlide = window.innerWidth >= 640
        ? Math.max(0, subAccounts.length - 2)
        : subAccounts.length - 1;
      setCurrentSlide(Math.min(maxSlide, currentSlide + step));
    }
    
    if (isRightSwipe) {
      // Swipe right - go to previous slide
      const step = window.innerWidth >= 640 ? 2 : 1;
      setCurrentSlide(Math.max(0, currentSlide - step));
    }
  };

  const fetchBanks = async () => {
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
      fetchBanks();
    } catch (error) {
      toast.error('Failed to add bank: ' + error.message);
    }
  };

  const handleDeleteBank = async (bankId) => {
    try {
      if (!bankId) {
        toast.error('Bank ID not found');
        return;
      }

      if (window.confirm('Are you sure you want to delete this bank account?')) {
        await apiHelper.delete(`/bank/deleteBank/${bankId}`);
        toast.success('Bank account deleted successfully!');
        fetchBanks();
        setSelectedBankId('');
      }
    } catch (error) {
      toast.error('Failed to delete bank account: ' + error.message);
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
        setSubUserBalanceLoading(false);
      } else {
        // Keep loading if status is pending
        setTimeout(() => fetchSubUserBalance(subAccountId));
      }
    } catch (error) {
      console.error('Failed to fetch sub-user balance:', error);
      setSubUserBalance(0);
      setSubUserBalanceLoading(false);
    }
  };

  const handleSubUserWithdraw = async (e) => {
    e.preventDefault();
    setTransactionProcessing(true);

    try {
      // if (subUserWithdrawForm.selectedBankId === '') {
      //   toast.error('Please select a bank account');
      //   setTransactionProcessing(false);
      //   return;
      // }

      // const selectedBank = savedBanks[parseInt(subUserWithdrawForm.selectedBankId)];
      // if (!selectedBank) {
      //   toast.error('Selected bank not found');
      //   setTransactionProcessing(false);
      //   return;
      // }

      const payload = {
        subUserId: selectedSubUser?.id || selectedSubUser?._id,
        amount: parseFloat(subUserWithdrawForm.amount),
        mode: 'Wallet',
        role: 'SubUser',
        // upiId: selectedBank.upiId,
        // bankName: selectedBank.bankName,
        // accNo: selectedBank.accNo,
        // accHolderName: selectedBank.accHolderName,
        // ifscCode: selectedBank.ifscCode
      };

      await apiHelper.post('/transaction/withdrawAmountRequest_ForSubUser', payload);
      toast.info('Withdrawal request submitted successfully plese check history!');
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

  const checkTransactionStatus = async (subAccountId) => {
    try {
      const response = await apiHelper.get(`/transaction/latest-transaction/${subAccountId}`);
      const transaction = response?.data || response;

      if (transaction?.status === 'Accept') {
        toast.success('Your transaction successful!');
        setTransactionProcessing(false);
        setShowSubUserDeposit(false);
        setSubUserDepositForm({ amount: '' });
        setSelectedSubUser(null);
        fetchUserBalance();
      } else {
        setTimeout(() => checkTransactionStatus(subAccountId), 1000);
      }
    } catch (error) {
      console.error('Failed to check transaction status:', error);
      setTransactionProcessing(false);
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
      checkTransactionStatus(selectedSubUser?.id || selectedSubUser?._id);
    } catch (error) {
      toast.error('Failed to submit deposit request: ' + error.message);
      setTransactionProcessing(false);
    }
  };

  const checkPasswordResetStatus = async (clientName) => {
    try {
      const response = await apiHelper.get(`/password/get-latestPassword-change-by-clientName/${clientName}`);
      const passwordChange = response?.data || response;

      if (passwordChange?.status === 'Completed') {
        toast.success('Password reset completed successfully!');
        setResetPasswordLoading(false);
        setShowResetPassword(false);
        setResetPasswordForm({ newPassword: '' });
        setSelectedSubUser(null);
        fetchSubAccounts();
      } else {
        setTimeout(() => checkPasswordResetStatus(clientName), 2000);
      }
    } catch (error) {
      console.error('Failed to check password reset status:', error);
      setResetPasswordLoading(false);
    }
  };

  // const handleResetPassword = async (e) => {
  //   e.preventDefault();
  //   setResetPasswordLoading(true);

  //   try {
  //     if (resetPasswordForm.newPassword.includes(' ')) {
  //       toast.error('Password cannot contain spaces');
  //       setResetPasswordLoading(false);
  //       return;
  //     }

  //     if (!validatePassword(resetPasswordForm.newPassword)) {
  //       toast.error('Password must contain 8+ characters with 1 uppercase, 1 lowercase, 1 number, 1 special character. Avoid common passwords and sequential patterns');
  //       setResetPasswordLoading(false);
  //       return;
  //     }

  //     const payload = {
  //       subUserId: selectedSubUser?.id || selectedSubUser?._id,
  //       clientName: selectedSubUser?.clientName,
  //       newPassword: resetPasswordForm.newPassword
  //     };

  //     await apiHelper.post('/password/create-password-change-log', payload);
  //     toast.success('Password reset request submitted successfully!');
  //     setResetPasswordLoading(false);
  //     setShowResetPassword(false);
  //     setResetPasswordForm({ newPassword: '' });
  //     setSelectedSubUser(null);
  //     checkPasswordResetStatus(selectedSubUser?.clientName);
  //   } catch (error) {
  //     toast.error('Failed to reset password: ' + error.message);
  //     setResetPasswordLoading(false);
  //   }
  // };


  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetPasswordLoading(true);

    try {
      let finalPassword = resetPasswordForm.newPassword;

      // ✅ LOTUSBOOK default password
      if (selectedSubUser?.gameName === 'LOTUSBOOK') {
        finalPassword = 'Lotu@1255';
      } else {
        if (finalPassword.includes(' ')) {
          toast.error('Password cannot contain spaces');
          setResetPasswordLoading(false);
          return;
        }

        if (!validatePassword(finalPassword)) {
          toast.error(
            'Password must contain 8+ characters with 1 uppercase, 1 lowercase, 1 number, 1 special character'
          );
          setResetPasswordLoading(false);
          return;
        }
      }

      const payload = {
        subUserId: selectedSubUser?.id || selectedSubUser?._id,
        clientName: selectedSubUser?.clientName,
        newPassword: finalPassword,
      };

      await apiHelper.post('/password/create-password-change-log', payload);

      toast.success('Password reset request submitted successfully!');
      setShowResetPassword(false);
      setResetPasswordForm({ newPassword: '' });
      setSelectedSubUser(null);

      checkPasswordResetStatus(selectedSubUser?.clientName);
    } catch (error) {
      toast.error('Failed to reset password: ' + error.message);
    } finally {
      setResetPasswordLoading(false);
    }
  };


  const fetchGames = async () => {
    try {
      // Fetch both games and panels
      const [gamesResponse, panelsResponse] = await Promise.all([
        apiHelper.get('/game/getAllGamesWithPagination?page=1&limit=50'),
        apiHelper.get('/panel/getAllPanels?page=1&limit=10')
      ]);

      const gamesList = gamesResponse.games || gamesResponse.data || gamesResponse || [];
      const panelsData = panelsResponse.data?.panels || panelsResponse.panels || panelsResponse.data || panelsResponse || [];

      // Filter only active panels
      const activePanels = panelsData.filter(panel => panel?.isActive === true);

      // Get unique game names from active panels
      const activeGameNames = [...new Set(activePanels.map(panel => panel.panelName || panel.name))];

      // Filter games that have active panels
      const availableGames = gamesList.filter(game =>
        activeGameNames.includes(game.name) && (game.status || game.isActive)
      );

      setGames(availableGames);
    } catch (error) {
      console.error('Failed to fetch games:', error);
      setGames([]);
    }
  };

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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const checkIdCreationStatus = async (subAccountId) => {
    try {
      const response = await apiHelper.get(`/subAccount/latest-sub-user/${subAccountId}`);
      const transaction = response?.data?.status;

      if (transaction === 'Accept') {
        setIdCreated(true);
        setTimeout(() => {
          setLoading(false);
          setShowCreateId(false);
          setIdCreated(false);
          setFormData({
            gameId: formData.gameId,
            clientName: '',
            password: '',
            phone: ''
          });
          fetchSubAccounts();
        }, 2000);
        return; // Stop further API calls
      } else {
        setTimeout(() => checkIdCreationStatus(subAccountId), 2000);
      }
    } catch (error) {
      console.error('Failed to check ID creation status:', error);
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const commonPasswords = ['Abcd@1234', 'Password@123', 'Admin@123', 'Test@1234', 'User@1234'];

    // Check for sequential alphabetical patterns
    const hasSequentialPattern = /abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/i.test(password);

    return regex.test(password) && !commonPasswords.includes(password) && !hasSequentialPattern;
  };

  const handleCreateId = async (e) => {
    e.preventDefault();

    if (formData.clientName.length > 9) {
      toast.error('Client name must be maximum 9 characters');
      return;
    }

    if (formData.clientName.includes(' ')) {
      toast.error('Client name cannot contain spaces');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(formData.clientName)) {
      toast.error('Client name can only contain letters and numbers');
      return;
    }





    setLoading(true);

    try {
      const payload = {
        gameId: formData.gameId,
        clientName: formData.clientName,
        phone: user?.phone || ''
      };

      const response = await apiHelper.post('/subAccount/createSubAccount', payload);
      const createdAccount = response?.data || response;
      const subAccountId = createdAccount?.id || createdAccount?._id;

      if (subAccountId) {
        checkIdCreationStatus(subAccountId);
      } else {
        toast.success('ID created successfully!');
        setLoading(false);
        setShowCreateId(false);
        setFormData({
          gameId: formData.gameId,
          clientName: '',
          password: '',
          phone: ''
        });
        fetchSubAccounts();
      }
    } catch (error) {
      toast.error('Failed to create ID: ' + error.message);
      setLoading(false);
    }
  };



  const fetchUserBalance = async () => {
    setBalanceLoading(true);
    try {
      const userId = user?._id;
      if (!userId) {
        return;
      }
      const balanceResponse = await apiHelper.get(`/transaction/get_MainUserBalance/${userId}`);
      setUserBalance(balanceResponse?.data?.balance || 0);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setUserBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const checkPendingTransactions = async () => {
    try {
      const userId = user?._id;
      if (!userId) return;

      const transactionsResponse = await apiHelper.post(`/transaction/getUserTransactions/${userId}?page=1&limit=10`);
      const transactions = transactionsResponse?.data?.transactions || [];


      for (const transaction of transactions) {
        if (transaction?.status === 'Accept' && transaction?.mode == 'Wallet' && transaction?.transactionStatus != "Completed") {
          try {
            // ✅ Step 1: Get transaction detail
            const statusResponse = await apiHelper.get(
              `/transaction/get_single_transactions/${transaction?._id}`
            );

            if (statusResponse?.data) {
              const currentStatus = statusResponse?.data?.status;

              // ✅ Step 2: Update transaction based on status
              let updatedStatus = 'Pending'; // default
              if (currentStatus === 'Accept') {
                updatedStatus = 'Completed';
              } else if (currentStatus === 'Insufficent') {
                updatedStatus = 'Reject';
              } else if (currentStatus === 'Pending') {
                updatedStatus = 'Pending';
              }

              await apiHelper.patch(`/transaction/update_Wallet_Withdrawal_Transaction/${transaction?._id}`, {
                status: updatedStatus,
              });

              setUpdatedTransactions(transaction?._id);

              // ✅ Step 3: Handle toast + balance refresh
              if (updatedStatus === 'Completed') {
                toast.success('Transaction completed successfully!');
                fetchUserBalance();
              }
            }
          } catch (error) {
            console.log('Error updating transaction:', transaction?._id, error);
          }
        }
      }



      for (const transaction of transactions) {
        try {
          const statusResponse = await apiHelper.get(
            `/transaction/callCheckStatus/${transaction?._id}`
          );

          if (!statusResponse?.data?.success) continue;

          const newStatus = statusResponse?.data?.data?.status;

          // ❌ Withdrawal + Initial → UPDATE MAT KARO
          if (
            transaction?.transactionType === "Withdrawal" &&
            newStatus === "Initial"
          ) {
            continue; // ⛔ yahin loop skip
          }

          // ✅ Sirf valid cases me update
          if (newStatus) {
            await apiHelper.patch(
              `/transaction/update_Transaction_Request_Data_of_Request/${transaction?._id}`,
              { status: newStatus }
            );

            // ✅ Final actions
            if (newStatus === "Accept") {
              toast.success("Transaction completed successfully!");
              fetchUserBalance();
              setUpdatedTransactions(transaction?._id);
            } else if (newStatus === "Reject") {
              toast.error("Transaction Rejected");
              fetchUserBalance();
              setUpdatedTransactions(transaction?._id);
            } else if (newStatus === "Initial") {
              
            }
          }
        } catch (statusError) {
          console.log(
            "Status check error for transaction:",
            transaction?._id,
            statusError
          );
        }
      }




    } catch (error) {
      console.log('Background status check error:', error);
    }
  };

  // useEffect(() => {
  //   setInterval(() => {
  //     checkPendingTransactions();
  //   }, 5000);
  // }, []);

  useEffect(() => {
    fetchUserBalance()
  }, [user, balanceLogData, userTransactions, showCreateTransaction]);

  useEffect(() => {
    if (user?._id) {
      checkPendingTransactions();
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) {
      const interval = setInterval(() => {
        checkPendingTransactions();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleViewWallet = async (pageNum = 1, filters = walletFilters) => {
    // Ensure pageNum is a number
    const page = Number(pageNum) || 1;

    if (page === 1) {
      setShowWallet(true);
    }
    setTransactionsLoading(true);
    try {
      const userId = user?._id;
      if (!userId) {
        toast.error('User not found');
        setTransactionsLoading(false);
        return;
      }

      const payload = {
        page: page,
        limit: 10,
        ...filters
      };

      // Remove empty filters
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      const transactionsResponse = await apiHelper.post(`/transaction/getUserTransactions/${userId}`, payload);
      const transactions = transactionsResponse?.data?.transactions || [];
      const pagination = transactionsResponse?.data?.pagination || {};

      setCurrentPage(Number(pagination.currentPage) || page);
      setTotalPages(Number(pagination.totalPages) || 1);
      setTotalTransactions(Number(pagination.totalTransactions) || transactions.length);


      setUserTransactions(transactions);
    } catch (error) {
      console.error('Transaction fetch error:', error);
      toast.error('Failed to fetch transactions: ' + error.message);
      setUserTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleWalletFilterChange = (key, value) => {
    setWalletFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyWalletFilters = () => {
    setCurrentPage(1);
    handleViewWallet(1, walletFilters);
  };

  const clearWalletFilters = () => {
    const clearedFilters = {
      status: '',
      transactionType: '',
      minAmount: '',
      maxAmount: ''
    };
    setWalletFilters(clearedFilters);
    setCurrentPage(1);
    handleViewWallet(1, clearedFilters);
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
          toast.info('Processing payment... Please wait');
          setTimeout(() => {
            window.location.href = `http://powerdreams.org/online/pay/Pbk1157/${transaction?._id}/pilotplay`;
          }, 2000);

          
        } else if (transactionForm?.transactionType === 'Withdraw') {
          // Call external API for withdrawal
          const selectedBank = savedBanks[parseInt(selectedBankId)];
          if (selectedBank) {
            try {
              
              toast.info('Withdrawal request submitted successfully!');
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

  const handleDeleteSubAccount = (account) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);

    try {
      const subAccountId = accountToDelete?.id || accountToDelete?._id;

      // Create balance log
      await apiHelper.post('/balance/createBalanceLog', { userId: subAccountId });

      // Keep checking until CurrentBalance is available
      const checkBalance = async () => {
        const response = await apiHelper.get(`/balance/getBalanceLogBySubUserId/${subAccountId}`);
        const currentBalance = response?.data?.CurrentBalance;

        if (currentBalance === undefined) {
          setTimeout(checkBalance, 1000);
          return;
        }

        if (currentBalance >= 1) {
          toast.error('Please withdraw the balance first before deleting the account');
          setDeleteLoading(false);
          setShowDeleteConfirm(false);
          return;
        }

        // Delete account
        await apiHelper.delete(`/subAccount/deleteSubAccount/${subAccountId}`);
        toast.success(`${accountToDelete?.clientName} has been deleted...`);
        fetchSubAccounts();
        setDeleteLoading(false);
        setShowDeleteConfirm(false);
      };

      checkBalance();
    } catch (error) {
      toast.error('Failed to delete account: ' + error.message);
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    fetchGames();
    fetchSubAccounts();
    fetchUserBalance();
  }, []);

  // Smart polling for sub accounts - only when there are pending statuses
  useEffect(() => {
    if (subAccounts.length === 0) return;

    const hasPendingAccounts = subAccounts.some(account => account.status === 'Pending');

    if (!hasPendingAccounts) {
      return; // Stop polling if no pending accounts
    }

    const interval = setInterval(() => {
      fetchSubAccounts();
    }, 5000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [subAccounts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.relative')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  return (
    <div className="min-h-screen bg-[#0e0e0e] max-w-[769px] mx-auto">


      {/* Main Content */}
      <div className="max-w-[769px] mx-auto">

        {/* Modern Wallet Section */}
        <div
          className="relative w-full pt-10 pb-8 flex justify-center items-center"
          style={{
            background: 'url(/bghero.svg)',
            backgroundSize: '400px'
          }}
        >

          <Link to="/profile" className=" absolute top-0 left-4">
            <div className="w-7 h-7 sm:w-9 sm:h-9 border-1 border-white mt-3 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer">
              <span className="text-white font-semibold text-md sm:text-md">
                {user?.clientName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>

          </Link>

          <div className='absolute top-0 right-0'>
            <LanguageSelector />
          </div>

          {/* CENTER WRAPPER */}
          <div className="relative flex items-center">

            {/* LEFT – DEPOSIT */}
            <div
              onClick={() => {
                setTransactionForm({ ...transactionForm, transactionType: 'Deposit' });
                setShowCreateTransaction(true);
              }}
              className="w-[80px] h-[100px] mr-2 bg-[#1a1a1a] rounded-l-2xl
      flex flex-col items-center justify-center gap-2
      cursor-pointer shadow-2xl"
            >
              <span className="text-white text-sm">Deposit</span>
              <img src='/arrowup.svg' className="h-7 leading-none" />
            </div>

            {/* CENTER – MAIN WALLET */}
            <div
              className="w-[150px] h-[160px] bg-[#141414] rounded-3xl
      flex flex-col items-center justify-center
      mx-[-14px] z-10 shadow-2xl shadow-black"
            >
              <img
                src="/logoforlogin.png"
                alt="Logo"
                className="h-14 mb-4"
              />

              <p className="text-white/70 text-xs tracking-widest mb-1">
                WALLET BALANCE
              </p>

              <div className="flex items-center gap-2 text-white text-xl font-semibold">
                <img src="/coinsicon.png" className='w-5' alt="" />
                <span>{userBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* RIGHT – WITHDRAW */}
            <div
              onClick={() => {
                setTransactionForm({ ...transactionForm, transactionType: 'Withdraw' });
                setShowCreateTransaction(true);
                fetchBanks();
              }}
              className="w-[80px] h-[100px] ml-2 bg-[#1a1a1a] rounded-r-2xl
      flex flex-col items-center justify-center gap-2
      cursor-pointer shadow-2xl"
            >
              <span className="text-white text-sm">Withdraw</span>
              <img src='/arrowdown.svg' className="h-7 leading-none" />
            </div>

          </div>
        </div>




        {/* Sub Accounts Slider */}
        <div className="m-1 rounded-2xl mt-[22px] mx-2 p-4 sm:p-6 bg-[#1b1b1b] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">

          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {t('myIds')} ({subAccounts.length})
              </h2>
              <p className="text-[12px] text-blue-200">
                {t('manageAccounts')}
              </p>
            </div>

            {subAccounts.length > 1 && (
              <div className="flex flex-wrap justify-end gap-2">
                <Link to={'/my-ids'}>
                  <button className='px-2 h-9 rounded-lg bg-[#005993] text-white text-[14px] sm:text-[16px] font-semibold'>
                    Get New Id
                  </button>
                </Link>
                <div className='flex gap-1 sm:gap-2'>
                  <button
                    onClick={() => {
                      const step = window.innerWidth >= 640 ? 2 : 1;
                      setCurrentSlide(Math.max(0, currentSlide - step));
                    }}
                    className="w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className='mx-auto' />
                  </button>
                  <button
                    onClick={() => {
                      const step = window.innerWidth >= 640 ? 2 : 1;
                      const maxSlide =
                        window.innerWidth >= 640
                          ? Math.max(0, subAccounts.length - 2)
                          : subAccounts.length - 1;
                      setCurrentSlide(Math.min(maxSlide, currentSlide + step));
                    }}
                    className="w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronRight className='mx-auto' />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentSlide * (100 / (window.innerWidth >= 640 ? 2 : 1))}%)`,
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {subAccounts.map((account, index) => {
                const game = account.gameId?.name;
                const isRejected = account.status === "Reject";

                return (
                  <div
                    key={account.id || account._id || index}
                    className="flex-shrink-0 px-2 sm:px-0.5"
                    style={{ width: window.innerWidth >= 640 ? '50%' : '100%' }}
                  >
                    <div className="rounded-2xl p-5 bg-[#3f3f3f] text-white">

                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-12 h-12 overflow-hidden rounded-full bg-black flex items-center justify-center">
                            <img
                              src={account.gameId?.image}
                              alt={account.gameId?.name}
                              className="w-full m-auto h-auto rounded"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm sm:text-lg notranslate">
                              {game || 'Game'}
                            </h3>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${account.status === "Accept"
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
                                  ? t('reject')
                                  : t('pending')}
                          </span>

                          <button
                            onClick={() => handleDeleteSubAccount(account)}
                            className="p-1 -mr-0.5 text-red-600 bg-red-50 rounded-lg transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Account Details */}
                      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">

                        {/* ID */}
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded flex items-center justify-center">
                            <span className="text-xs">👤</span>
                          </div>
                          <span className="text-xs sm:text-sm notranslate">ID:</span>

                          <span
                            className={`text-xs sm:text-sm font-mono truncate notranslate ${isRejected ? "blur-[2px] select-none" : ""
                              }`}
                          >
                            {account?.clientName || 'N/A'}
                          </span>

                          <button
                            onClick={() => {
                              if (isRejected) return;
                              navigator.clipboard.writeText(account?.clientName || '');
                              toast.success('ID copied to clipboard!');
                            }}
                            disabled={isRejected}
                            className={`ml-auto p-1 rounded ${isRejected
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-gray-800"
                              }`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded flex items-center justify-center">
                            <span className="text-xs">🔒</span>
                          </div>
                          <span className="text-xs sm:text-sm notranslate">
                            {t('password')}:
                          </span>

                          <span
                            className={`text-xs sm:text-sm font-mono truncate flex-1 notranslate ${isRejected ? "blur-[2px] select-none" : ""
                              }`}
                          >
                            {account?.password || 'N/A'}
                          </span>

                          <button
                            onClick={() => {
                              if (isRejected) return;
                              navigator.clipboard.writeText(account?.password || '');
                              toast.success('Password copied to clipboard!');
                            }}
                            disabled={isRejected}
                            className={`p-1 rounded ${isRejected
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-gray-800"
                              }`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Platform */}
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded flex items-center justify-center">
                            <span className="text-xs">🌐</span>
                          </div>
                          <span className="text-xs sm:text-sm notranslate">
                            {t('platform')}:
                          </span>

                          <span
                            className={`text-xs sm:text-sm font-mono truncate ${isRejected ? "blur-[2px] select-none" : ""
                              }`}
                          >
                            {account?.gameId?.gameUrl || 'N/A'}
                          </span>

                          <button
                            onClick={() => {
                              if (isRejected) return;
                              if (account?.gameId?.gameUrl) {
                                window.open(account.gameId.gameUrl, '_blank');
                              } else {
                                toast.error('Platform URL not available');
                              }
                            }}
                            disabled={isRejected}
                            className={`ml-auto p-1 rounded ${isRejected
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-gray-800"
                              }`}
                          >
                            <LinkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {account.status === "Reject" && account.remarks && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-700/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs text-white">!</span>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-red-700 mb-1">
                                Rejection Reason:
                              </p>
                              <p className="text-xs text-red-700">
                                {account.remarks}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {account.status !== "Reject" && (
                        <div className="flex gap-2 sm:gap-3 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedSubUser(account);
                              setShowSubUserDeposit(true);
                            }}
                            disabled={account.status !== "Accept"}
                            className={`flex-1 py-2 px-2 sm:px-4 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors ${account.status === "Accept"
                              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                              : 'bg-gray-500 cursor-not-allowed opacity-50'
                              }`}
                          >
                            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">
                              {t('deposit')}
                            </span>
                          </button>

                          <button
                            onClick={async () => {
                              setSelectedSubUser(account);
                              await createBalanceLog(account?.id || account?._id);
                              setShowSubUserWithdraw(true);
                              fetchSubUserBalance(account?.id || account?._id);
                            }}
                            disabled={account.status !== "Accept"}
                            className={`flex-1 py-2 px-2 sm:px-4 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors ${account.status === "Accept"
                              ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                              : 'bg-gray-500 cursor-not-allowed opacity-50'
                              }`}
                          >
                            <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">
                              {t('withdraw')}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedSubUser(account);
                              setShowResetPassword(true);
                            }}
                            disabled={account.status !== "Accept"}
                            className={`flex-1 py-2 px-2 sm:px-4 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors ${account.status === "Accept"
                              ? 'cursor-pointer'
                              : 'cursor-not-allowed opacity-50'
                              }`}
                            style={{
                              backgroundColor:
                                account.status === "Accept" ? '#1477b0' : '#6b7280'
                            }}
                          >
                            <span className="text-xs sm:text-sm font-medium">
                              {t('resetPassword')}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>



        {/* Create ID Modal */}
        {showCreateId && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[100]">
            <div className="gaming-card p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('createNewId')}</h2>
                  <p className="text-gray-600 text-sm mt-1">Game: {games.find(g => (g.id || g._id) === formData.gameId)?.name || 'Select a game'}</p>
                </div>
                <button onClick={() => setShowCreateId(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {idCreated ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-green-600 mb-2">{t('idCreated')}</p>
                  <p className="text-sm text-gray-600">{t('idCreatedSuccess')}</p>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4" style={{ width: '32px', height: '32px' }}></div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">{t('creatingId')}</p>
                  <p className="text-sm text-gray-600">{t('pleaseWait')}</p>
                </div>
              ) : (
                <form onSubmit={handleCreateId} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">{t('clientName')}</label>
                    <input
                      type="text"
                      name="clientName"
                      placeholder={t('enterClientName')}
                      value={formData.clientName}
                      onChange={handleInputChange}
                      maxLength={9}
                      className="gaming-input"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('maxChars')}</p>
                  </div>





                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button type="submit" className="w-full sm:flex-1 gaming-btn">
                      {t('createId')}
                    </button>
                    <button type="button" onClick={() => setShowCreateId(false)} className="w-full sm:flex-1 btn-secondary">
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Wallet Modal */}
        {showWallet && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[100]">
            <div className="gaming-card p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('transactionHistory')}</h2>
                  <p className="text-gray-600 text-sm mt-1">{t('viewHistory')}</p>
                </div>
                <button onClick={() => {
                  setShowWallet(false);
                  setWalletFilters({
                    status: '',
                    transactionType: '',
                    minAmount: '',
                    maxAmount: ''
                  });
                  fetchUserBalance();
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                    <select
                      value={walletFilters.status}
                      onChange={(e) => handleWalletFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">{t('allStatus')}</option>
                      <option value="Initial">{t('initial')}</option>
                      <option value="Pending">{t('pending')}</option>
                      <option value="Accept">{t('accept')}</option>
                      <option value="Reject">{t('reject')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('type')}</label>
                    <select
                      value={walletFilters.transactionType}
                      onChange={(e) => handleWalletFilterChange('transactionType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">{t('allTypes')}</option>
                      <option value="Deposit">{t('deposit')}</option>
                      <option value="Withdrawal">{t('withdraw')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')} (Min)</label>
                    <input
                      type="number"
                      value={walletFilters.minAmount}
                      onChange={(e) => handleWalletFilterChange('minAmount', e.target.value)}
                      placeholder="Min amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')} (Max)</label>
                    <input
                      type="number"
                      value={walletFilters.maxAmount}
                      onChange={(e) => handleWalletFilterChange('maxAmount', e.target.value)}
                      placeholder="Max amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={applyWalletFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    {t('applyFilters')}
                  </button>
                  <button
                    onClick={clearWalletFilters}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    {t('clearFilters')}
                  </button>
                </div>
              </div>

              {transactionsLoading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4" style={{ width: '32px', height: '32px' }}></div>
                  <p className="text-gray-600">{t('loadingTransactions')}...</p>
                </div>
              ) : userTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-2">{t('noTransactions')}</p>
                  <p className="text-sm">{t('requestFirstTransaction')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('amount')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Game Name</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('clientName')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Transection From</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('createdAt')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTransactions.map((transaction, index) => (
                        <tr key={transaction.id || transaction._id || index} className="table-row border-b border-gray-100">
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-gray-900">{((currentPage - 1) * 10) + index + 1}</p>
                          </td>
                          <td className="py-4 px-4">
                            {transaction?.transactionType === 'Withdrawal' && transaction?.mode === 'PowerPay' && transaction?.status === 'Accept' && (
                              <button
                                onClick={() => fetchTransactionScreenshot(transaction?._id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Screenshot"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <p className={`text-sm font-medium ${transaction.transactionType === 'Deposit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {transaction.transactionType === 'Deposit' ? '+' : '-'}₹{transaction.amount}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${transaction.transactionType === 'Deposit'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {transaction.transactionType}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">{transaction.gameName || 'Main Wallet'}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">{transaction.clientName || 'N/A'}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${transaction.status === 'Accept'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'Reject'
                                ? 'bg-red-100 text-red-800'
                                : transaction.status === 'Pending'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {transaction.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">{transaction.remarks || 'No remark'}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">
                              {transaction.mode === "Wallet"
                                ? "Game Transaction"
                                : transaction.mode === "PowerPay"
                                  ? "Wallet Transaction"
                                  : transaction.mode}
                            </p>
                          </td>

                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">{new Date(transaction.createdAt).toLocaleString('en-IN', { hour12: true })}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">{transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleString('en-In', { hour12: true }) : 'N/A'}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Simple Pagination */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {t('showingPage')} {currentPage} {t('transactions')}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewWallet(currentPage - 1)}
                        disabled={currentPage === 1 || transactionsLoading}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('previous')}
                      </button>
                      <span className="px-3 py-2 text-sm bg-gray-100 rounded-lg">
                        {t('page')} {currentPage}
                      </span>
                      <button
                        onClick={() => handleViewWallet(currentPage + 1)}
                        disabled={transactionsLoading}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('next')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                  <label className="form-label">{t('amount')} ({t('minimumAmount')})</label>
                  <input
                    type="number"
                    placeholder={t('enterAmount')}
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    onWheel={(e) => e.target.blur()}
                    className="gaming-input"
                    required
                    min="100"
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

        {/* Sub User Withdraw Modal */}
        {showSubUserWithdraw && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[100]">
            <div className="gaming-card p-4 sm:p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('withdrawFromSub')}</h2>
                  <p className="text-gray-600 text-sm mt-1">ID: {selectedSubUser?.clientName || 'N/A'}</p>
                  <div className="mt-2">
                    {subUserBalanceLoading ? (
                      <div className="flex items-center gap-3 bg-green-50 px-3 py-2 rounded-xl shadow-sm">
                        {/* Spinner */}
                        <div className="w-5 h-5 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>

                        {/* Loading Text */}
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
                <button onClick={() => {
                  setShowSubUserWithdraw(false);
                  fetchUserBalance();
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
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
                    <label className="form-label">{t('amount')} ({t('minimumAmount')})</label>
                    <input
                      type="number"
                      placeholder={t('enterAmount')}
                      value={subUserWithdrawForm.amount}
                      onChange={(e) => setSubUserWithdrawForm({ ...subUserWithdrawForm, amount: e.target.value })}
                      onWheel={(e) => e.target.blur()}
                      className="gaming-input"
                      required
                      min="100"
                    />
                  </div>

                  {/* {banksLoading ? (
                    <div className="text-center py-4">
                      <div className="loading-spinner mx-auto mb-2" style={{ width: '20px', height: '20px' }}></div>
                      <p className="text-gray-600 text-sm">Loading banks...</p>
                    </div>
                  ) : savedBanks.length > 0 ? (
                    <div className="form-group">
                      <label className="form-label">Select Bank Account</label>
                      <div className="space-y-3">
                        {savedBanks.map((bank, index) => (
                          <div
                            key={bank.id || bank._id || index}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${subUserWithdrawForm.selectedBankId === index.toString()
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                            onClick={() => setSubUserWithdrawForm({ ...subUserWithdrawForm, selectedBankId: index.toString() })}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="subUserBankSelection"
                                value={index}
                                checked={subUserWithdrawForm.selectedBankId === index.toString()}
                                onChange={() => setSubUserWithdrawForm({ ...subUserWithdrawForm, selectedBankId: index.toString() })}
                                className="text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{bank.bankName || 'Unknown Bank'}</div>
                                <div className="text-sm text-gray-600">{bank.accHolderName || 'Unknown Holder'}</div>
                                <div className="text-sm text-gray-500">****{bank.accNo?.slice(-4) || '0000'}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No bank accounts found. Add your first bank account.</p>
                    </div>
                  )} */}

                  {/* <button
                    type="button"
                    onClick={() => setShowAddBankModal(true)}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Bank
                  </button> */}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button type="submit" disabled={transactionProcessing} className="w-full sm:flex-1 gaming-btn">
                      {transactionProcessing ? (
                        <>{t('processing')}</>
                      ) : (
                        <>{t('withdraw')}</>
                      )}
                    </button>
                    <button type="button" onClick={() => {
                      setShowSubUserWithdraw(false);
                      fetchUserBalance();
                    }} className="w-full sm:flex-1 btn-secondary">
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Sub User Deposit Modal */}
        {showSubUserDeposit && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[100]">
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
                <button onClick={() => {
                  setShowSubUserDeposit(false);
                  fetchUserBalance();
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {transactionProcessing ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4" style={{ width: '32px', height: '32px' }}></div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">{t('processing')}...</p>
                  <p className="text-sm text-gray-600">Please wait while we process your deposit</p>
                </div>
              ) : (
                <form onSubmit={handleSubUserDeposit} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">{t('amount')} ({t('minimumAmount')})</label>
                    <input
                      type="number"
                      placeholder={t('enterAmount')}
                      value={subUserDepositForm.amount}
                      onChange={(e) => setSubUserDepositForm({ ...subUserDepositForm, amount: e.target.value })}
                      onWheel={(e) => e.target.blur()}
                      className="gaming-input"
                      required
                      min="100"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button type="submit" className="w-full sm:flex-1 gaming-btn">
                      {t('deposit')}
                    </button>
                    <button type="button" onClick={() => {
                      setShowSubUserDeposit(false);
                      fetchUserBalance();
                    }} className="w-full sm:flex-1 btn-secondary">
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {/* {showResetPassword && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[100]">
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
                  <X className="w-5 h-5" />
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
                    <button type="submit" className="w-full sm:flex-1 gaming-btn">
                      {t('resetPassword')}
                    </button>
                    <button type="button" onClick={() => {
                      setShowResetPassword(false);
                      setResetPasswordForm({ newPassword: '' });
                      setSelectedSubUser(null);
                    }} className="w-full sm:flex-1 btn-secondary">
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )} */}


        {showResetPassword && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[100]">
            <div className="gaming-card p-4 sm:p-6 max-w-md w-full mx-4">

              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('resetPassword')}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    ID: {selectedSubUser?.clientName || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetPasswordForm({ newPassword: '' });
                    setSelectedSubUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resetPasswordLoading ? (
                <div className="text-center py-8">
                  <div
                    className="loading-spinner mx-auto mb-4"
                    style={{ width: '32px', height: '32px' }}
                  ></div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {t('processing')}...
                  </p>
                  <p className="text-sm text-gray-600">
                    Please wait while we process your password reset
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">

                  {/* ✅ LOTUSBOOK special case */}
                  {selectedSubUser?.gameName === 'LOTUSBOOK' ? (
                    <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                      <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                        Confirm Password Reset
                      </h3>
                      <p className="text-sm text-yellow-700">
                        This user belongs to <b>LOTUSBOOK</b>.
                        Are you sure you want to reset the password to the default password?
                      </p>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">{t('newPassword')}</label>
                      <PasswordInput
                        name="newPassword"
                        placeholder="Example@1256"
                        value={resetPasswordForm.newPassword}
                        onChange={(e) =>
                          setResetPasswordForm({
                            ...resetPasswordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="gaming-input"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must contain 8+ characters with 1 uppercase, 1 lowercase,
                        1 number, 1 special character.
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button type="submit" className="w-full sm:flex-1 gaming-btn">
                      {selectedSubUser?.gameName === 'LOTUSBOOK'
                        ? 'Yes, Reset Password'
                        : t('resetPassword')}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setResetPasswordForm({ newPassword: '' });
                        setSelectedSubUser(null);
                      }}
                      className="w-full sm:flex-1 btn-secondary"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-[100]">
          <div className="gaming-card p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
                <p className="text-gray-600 text-sm mt-1">ID: {accountToDelete?.clientName || 'N/A'}</p>
              </div>
              {!deleteLoading && (
                <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {deleteLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4" style={{ width: '32px', height: '32px' }}></div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Deleting Account...</p>
                <p className="text-sm text-gray-600">Please wait while we process your request</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700">Are you sure want to delete your ID?</p>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full sm:flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="w-full sm:flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Bottom padding to prevent content overlap */}
      <BottomNavigation activePage="home" />
    </div>
  );
};

export default UserDashboard;
