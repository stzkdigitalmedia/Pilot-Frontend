import { useState, useEffect } from 'react';
import { Menu, X, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { apiHelper } from '../utils/apiHelper';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { user } = useAuth(true);
    const { t } = useTranslation();
    const [showCreateTransaction, setShowCreateTransaction] = useState(false);
    const [transactionForm, setTransactionForm] = useState({ amount: '', transactionType: 'Deposit' });
    const [transactionProcessing, setTransactionProcessing] = useState(false);
    const [userBalance, setUserBalance] = useState(0);
    const [savedBanks, setSavedBanks] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [banksLoading, setBanksLoading] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);

    const fetchUserBalance = async () => {
        try {
            if (!user?._id) {
                return;
            }
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
            const response = await apiHelper.get('/user/getSavedBanks');
            if (response?.success) {
                setSavedBanks(response?.data || []);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
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

            payload.branchUserName = 'Drd247D';

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
                        window.location.href = `http://powerdreams.org/online/pay/Drd247D/${transaction?._id}`;
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

    return (
        <>
            <header className="max-w-[769px] mx-auto bg-[#3f3f3f] h-[56px] flex items-center px-3 shadow-md">
                {/* LEFT */}
                <div className="flex items-center gap-3">
                    <Link to="/">
                        <img
                            src="/logoforlogin.png"
                            alt="Logo"
                            className="w-10 object-contain"
                        />
                    </Link>
                </div>

                {/* RIGHT */}
                <div className="ml-auto flex items-center gap-2">
                    <p className='text-[12px] text-white'>{user?.balance.toLocaleString()} Bal</p>
                    <button
                        onClick={() => {
                            setTransactionForm({ amount: '', transactionType: 'Deposit' });
                            setShowCreateTransaction(true);
                            fetchUserBalance();
                        }}
                        className="bg-white text-black text-sm px-4 py-1.5 rounded-md transition"
                    >
                        Deposit
                    </button>
                </div>
            </header>

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
        </>
    );
};

export default Header;
