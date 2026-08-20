import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bell, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({ email: true, sms: true, whatsapp: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/users/profile').then((r) => {
      const p = r.data.data?.notificationPreferences;
      if (p) setPrefs({ email: p.email, sms: p.sms, whatsapp: p.whatsapp });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await api.patch('/users/notification-preferences', prefs);
      setMsg('Preferences saved!');
      setTimeout(() => navigate('/profile'), 1500);
    } catch { setMsg('Failed to save preferences'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="max-w-lg mx-auto space-y-6"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full rounded-xl" /></div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Choose how you'd like to receive notifications</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {msg && (
            <div className={`p-3 text-sm rounded-md ${msg.includes('saved') ? 'text-emerald-600 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'text-destructive bg-destructive/10 border border-destructive/20'}`}>
              {msg}
            </div>
          )}

          <p className="text-sm text-muted-foreground">Choose how you'd like to receive notifications about orders and payments.</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive order updates via email</p>
              </div>
              <Switch checked={prefs.email} onCheckedChange={(checked) => setPrefs({ ...prefs, email: checked })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Get text messages for important updates</p>
              </div>
              <Switch checked={prefs.sms} onCheckedChange={(checked) => setPrefs({ ...prefs, sms: checked })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">WhatsApp Notifications</Label>
                <p className="text-xs text-muted-foreground">Get WhatsApp messages for updates</p>
              </div>
              <Switch checked={prefs.whatsapp} onCheckedChange={(checked) => setPrefs({ ...prefs, whatsapp: checked })} />
            </div>
          </div>

          <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save size={16} /> Save Preferences</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
