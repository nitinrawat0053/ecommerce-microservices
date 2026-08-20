import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';

export default function PaymentVerify() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ razorpayOrderId: '', razorpayPaymentId: '', razorpaySignature: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await api.post('/payments/verify', form);
      setSuccess('Payment verified successfully!');
      setTimeout(() => navigate('/payments'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verify Payment</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manually verify a Razorpay payment</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">{error}</div>}
            {success && <div className="p-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{success}</div>}

            <div className="space-y-2">
              <Label>Razorpay Order ID</Label>
              <Input required value={form.razorpayOrderId} onChange={update('razorpayOrderId')} placeholder="order_ABC123" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Razorpay Payment ID</Label>
              <Input required value={form.razorpayPaymentId} onChange={update('razorpayPaymentId')} placeholder="pay_XYZ789" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Signature</Label>
              <Input required value={form.razorpaySignature} onChange={update('razorpaySignature')} placeholder="HMAC SHA256 signature" className="font-mono" />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck size={16} /> Verify Payment</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
