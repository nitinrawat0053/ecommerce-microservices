import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft, Loader2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyPhone() {
  const { verifyPhone, resendOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as any) || {};
  const phone = state.phone || '';
  const fromProfile = state.fromProfile || false;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await verifyPhone(phone, code);
      toast.success('Phone verified successfully!');
      if (fromProfile) {
        navigate('/profile');
      } else {
        setSuccess('Phone verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await resendOtp(phone);
      toast.success('OTP resent successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <ShieldCheck size={24} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Verify your phone</h1>
          <p className="text-muted-foreground text-sm">
            Enter the 6-digit code sent to {phone || 'your phone'}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                  {success}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono h-12"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCw size={14} className="mr-2" />
                )}
                {resending ? 'Resending...' : 'Resend OTP'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            to={fromProfile ? '/profile' : '/login'}
            className="font-medium text-foreground hover:underline inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            {fromProfile ? 'Back to profile' : 'Back to login'}
          </Link>
        </p>
      </div>
    </div>
  );
}
