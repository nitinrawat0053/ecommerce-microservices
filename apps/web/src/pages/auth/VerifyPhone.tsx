import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, KeyRound } from 'lucide-react';

export default function VerifyPhone() {
  const { verifyPhone } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const phone = (location.state as any)?.phone || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await verifyPhone(phone, code);
      setSuccess('Phone verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text">Verify Phone</h1>
          <p className="text-text-muted mt-2">Enter the 6-digit OTP sent to {phone || 'your phone'}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-border p-8 space-y-5">
          {error && <div className="p-3 bg-red-50 text-danger text-sm rounded-lg">{error}</div>}
          {success && <div className="p-3 bg-green-50 text-success text-sm rounded-lg">{success}</div>}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">OTP Code</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
              <input required maxLength={6} pattern="\d{6}" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <ShieldCheck size={16} />
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <p className="text-center text-sm text-text-muted">
            <Link to="/login" className="text-primary hover:text-primary-hover font-medium">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
