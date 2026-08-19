import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Bell, ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

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
    setSaving(true);
    setMsg('');
    try {
      await api.patch('/users/notification-preferences', prefs);
      setMsg('Preferences saved!');
      setTimeout(() => navigate('/profile'), 1500);
    } catch { setMsg('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-surface-alt rounded-xl">
      <span className="text-sm font-medium">{label}</span>
      <button type="button" onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-2xl font-bold">Notification Preferences</h1>
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        {msg && <div className={`p-3 text-sm rounded-lg ${msg.includes('saved') ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>{msg}</div>}
        <p className="text-sm text-text-muted">Choose how you'd like to receive notifications about orders and payments.</p>
        <Toggle label="📧 Email" value={prefs.email} onChange={() => setPrefs({ ...prefs, email: !prefs.email })} />
        <Toggle label="💬 SMS" value={prefs.sms} onChange={() => setPrefs({ ...prefs, sms: !prefs.sms })} />
        <Toggle label="📱 WhatsApp" value={prefs.whatsapp} onChange={() => setPrefs({ ...prefs, whatsapp: !prefs.whatsapp })} />
        <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
