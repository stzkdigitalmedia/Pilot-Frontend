import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiHelper } from '../utils/apiHelper';
import { useToastContext } from '../App';
import BottomNavigation from '../components/BottomNavigation';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { BookOpen, Filter, Search, X, Eye } from 'lucide-react';

const Passbook = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToastContext();
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    transactionType: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [screenshotData, setScreenshotData] = useState(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchTransactions();
    }
  }, [page, user]);

  const fetchTransactions = async (currentPage = page, currentFilters = filters) => {
    setLoading(true);
    try {
      const payload = {
        page: currentPage,
        limit: 20,
        ...currentFilters
      };

      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      const response = await apiHelper.post(`/transaction/getUserTransactions/${user?._id}`, payload);
      const data = response?.data?.transactions || [];
      const pagination = response?.data?.pagination || {};

      setTransactions(data);
      setTotalPages(pagination.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchTransactions(1, filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      transactionType: '',
      minAmount: '',
      maxAmount: ''
    };
    setFilters(clearedFilters);
    setPage(1);
    fetchTransactions(1, clearedFilters);
    setShowFilters(false);
  };

  const fetchTransactionScreenshot = async (transactionId) => {
    setScreenshotLoading(true);
    try {
      const response = await apiHelper.get(`/transaction/fetch_powerPay_transaction_screenshot/${transactionId}`);
      setScreenshotData(response);
      setShowScreenshot(true);
    } catch (error) {
      toast.error('Failed to fetch screenshot: ' + error.message);
    } finally {
      setScreenshotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-[900px] mx-auto">
        <div className="bg-gradient-to-r flex justify-between from-blue-600 to-blue-700 text-white px-6 py-3 rounded-b-3xl shadow-lg fixed top-0 left-0 right-0 z-10 max-w-[900px] mx-auto">
          <div className="flex items-center w-full align-middle flex-wrap justify-between mb-2">
            <div className='my-2'>
              <div className="flex items-center gap-2 sm:gap-3">
                <BookOpen size={20} className="sm:w-7 sm:h-7" />
                <h1 className="text-lg sm:text-2xl font-bold">{t('history')}</h1>
              </div>
              <p className="text-xs sm:text-sm text-blue-100">{t('viewHistory')}</p>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1 bg-white/20 flex rounded-lg hover:bg-white/30"
              >
                <Filter size={20} className='my-auto mx-2' /> {t('applyFilters')}
              </button>
            </div>
          </div>
          <LanguageSelector />
        </div>

        <div className="pt-32">

          {showFilters && (
            <div className="bg-white m-4 p-4 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">{t('applyFilters')}</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                    value={filters.transactionType}
                    onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{t('allTypes')}</option>
                    <option value="Deposit">{t('deposit')}</option>
                    <option value="Withdrawal">{t('withdraw')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')} (Min)</label>
                    <input
                      type="number"
                      value={filters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                      placeholder={t('amount')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')} (Max)</label>
                    <input
                      type="number"
                      value={filters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                      placeholder={t('amount')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Search size={16} />
                    {t('applyFilters')}
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {t('clearFilters')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 mt-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">{t('loadingTransactions')}...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">{t('noTransactions')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {transactions.map((transaction, index) => (
                    <div key={transaction?._id || index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs text-gray-500">#{((page - 1) * 20) + index + 1}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {transaction?.transactionType === 'Withdrawal' && transaction?.mode === 'PowerPay' && transaction?.status !== 'Reject' && (
                            <button
                              onClick={() => fetchTransactionScreenshot(transaction?._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Screenshot"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <div className="text-right">
                            <p className={`text-lg font-bold ${transaction?.transactionType === 'Deposit' ? 'text-green-600' : 'text-blue-600'
                              }`}>
                              ₹{transaction?.amount || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('type')}:</span>
                          <span className={`font-semibold px-2 py-1 rounded text-xs ${transaction?.transactionType === 'Deposit'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                            }`}>
                            {transaction?.transactionType === 'Deposit' ? t('deposit') :
                              transaction?.transactionType === 'Withdrawal' ? t('withdraw') :
                                transaction?.transactionType || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('gameName')}:</span>
                          <span className="font-medium text-gray-900">{transaction?.gameName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('clientName')}:</span>
                          <span className="font-medium text-gray-900">{transaction?.clientName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('status')}:</span>
                          <span className={`font-semibold ${transaction?.status === 'Accept' ? 'text-green-600' :
                            transaction?.status === 'Reject' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                            {transaction?.status === 'Accept' ? t('accept') :
                              transaction?.status === 'Reject' ? t('reject') :
                                transaction?.status === 'Pending' ? t('pending') :
                                  transaction?.status === 'Initial' ? t('initial') :
                                    transaction?.status || t('pending')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('remark')}:</span>
                          <span className="font-medium text-gray-900">{transaction?.remark || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('transactionFrom')}:</span>
                          <span className="font-medium text-gray-900">{transaction?.transactionFrom || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-100">
                          <span className="text-gray-500">{t('createdAt')}:</span>
                          <span className="text-gray-700 text-xs">
                            {transaction?.createdAt ? new Date(transaction.createdAt).toLocaleString('en-IN') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('updatedAt')}:</span>
                          <span className="text-gray-700 text-xs">
                            {transaction?.updatedAt ? new Date(transaction.updatedAt).toLocaleString('en-IN') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="bg-white rounded-xl p-4 mt-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        {t('previous')}
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              disabled={loading}
                              className={`px-3 py-2 text-sm rounded-lg disabled:opacity-50 ${page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                      >
                        {t('next')}
                      </button>
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-3">
                      {t('page')} {page} of {totalPages}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      {showScreenshot && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Transaction Screenshot</h3>
              <button
                onClick={() => {
                  setShowScreenshot(false);
                  setScreenshotData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {screenshotLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading screenshot...</p>
                </div>
              ) : screenshotData ? (
                <div className="space-y-4">
                  {screenshotData?.data?.data?.screenshotPeer ? (
                    <img
                      src={screenshotData?.data?.data.screenshotPeer}
                      alt="Transaction Screenshot"
                      className="w-full h-auto rounded-lg border"
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No screenshot available for this transaction</p>
                    </div>
                  )}
                  {screenshotData.message && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">{screenshotData.message}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Failed to load screenshot</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNavigation activePage="passbook" />
    </div>
  );
};

export default Passbook;
