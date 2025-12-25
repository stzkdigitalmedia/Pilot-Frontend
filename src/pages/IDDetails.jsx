import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiHelper } from '../utils/apiHelper';
import { useToastContext } from '../App';
import { ArrowLeft, ExternalLink, Copy } from 'lucide-react';
import Header from '../components/Header';

const IDDetails = () => {
  const { subaccid } = useParams();
  const navigate = useNavigate();
  const toast = useToastContext();

  const [idDetails, setIdDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIDDetails = async () => {
    try {
      const response = await apiHelper.get(
        `/subAccount/getSubUserID_DetailById/${subaccid}`
      );
      setIdDetails(response?.data || response);
    } catch (error) {
      toast.error('Failed to fetch ID details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subaccid) fetchIDDetails();
  }, [subaccid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] p-4 max-w-[900px] mx-auto text-white">
        <div className="text-center py-20 text-gray-400">
          Loading ID details...
        </div>
      </div>
    );
  }

  if (!idDetails) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] p-4 max-w-[900px] mx-auto text-white">
        <div className="text-center py-20 text-gray-400">
          ID details not found
        </div>
      </div>
    );
  }

  return (<>
    <Header />
    <div className="min-h-screen bg-[#0e0e0e] p-4 max-w-[900px] mx-auto text-white">


      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-lg bg-[#1b1b1b]
          flex items-center justify-center hover:bg-[#2a2a2a]"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold">ID Details</h1>
      </div>

      {/* ================= MAIN CARD ================= */}
      <div className="rounded-xl bg-[#1b1b1b]
        shadow-[0_6px_30px_rgba(0,0,0,0.7)]
        overflow-hidden">

        {/* TOP SECTION */}
        <div className="p-5">
          <div className="flex justify-between items-start gap-4">

            {/* LEFT */}
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center overflow-hidden">
                {idDetails.gameId?.image && (
                  <img
                    src={idDetails.gameId.image}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div>
                <h2 className="text-md font-semibold uppercase">
                  {idDetails.gameId?.name}
                </h2>
                <p className="text-sm text-gray-400">
                  {idDetails.gameId?.gameUrl}
                </p>
              </div>
            </div>

            {/* RIGHT ICONS */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() =>
                  window.open(idDetails.gameId?.gameUrl, '_blank')
                }
                className="hover:text-blue-400"
              >
                <ExternalLink size={20} />
              </button>
            </div>
          </div>

          {/* USERNAME */}
          <div className="flex justify-between items-center gap-3 mt-6">
            <div>
              <span className="text-gray-400 text-sm">Username:</span>
              <span className="text-sm">
                {idDetails.clientName}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(idDetails.clientName);
                toast.success('Username copied');
              }}
            >
              <Copy size={16} />
            </button>
          </div>

          {/* PASSWORD */}
          <div className="flex justify-between items-center gap-3 mt-3">
            <div>
              <span className="text-gray-400 text-sm">Password:</span>
              <span className="text-sm">
                {idDetails.password}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(idDetails.password);
                toast.success('Password copied');
              }}
            >
              <Copy size={16} />
            </button>
          </div>

          {/* NOTE */}
          {idDetails.note && (
            <p className="mt-4 text-sm text-white">
              {idDetails.note}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-[#2a2a2a] px-5 py-3 text-sm text-gray-300">
          ID Created on:{' '}
          {new Date(idDetails.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  </>
  );
};

export default IDDetails;
