import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Shield, Bell } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/profile').then((r) => setProfile(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div className="text-center py-20 text-text-muted">Could not load profile</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
            {profile.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-sm text-text-muted">{profile.role}</p>
          </div>
        </div>
        <div className="space-y-5">
          <div className="flex items-center gap-4 p-4 bg-surface-alt rounded-xl">
            <User size={18} className="text-primary" />
            <div><p className="text-xs text-text-muted">Name</p><p className="text-sm font-medium">{profile.name}</p></div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-surface-alt rounded-xl">
            <Mail size={18} className="text-primary" />
            <div><p className="text-xs text-text-muted">Email</p><p className="text-sm font-medium">{profile.email}</p></div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-surface-alt rounded-xl">
            <Phone size={18} className="text-primary" />
            <div><p className="text-xs text-text-muted">Phone</p><p className="text-sm font-medium">{profile.phone}</p></div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-surface-alt rounded-xl">
            <Shield size={18} className="text-primary" />
            <div><p className="text-xs text-text-muted">Verified</p><p className="text-sm font-medium">{profile.isVerified ? '✅ Yes' : '❌ No'}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-primary" />
            <div>
              <p className="text-sm font-semibold">Notification Preferences</p>
              <p className="text-xs text-text-muted">Email: {profile.notificationPreferences?.email ? '✅' : '❌'} · SMS: {profile.notificationPreferences?.sms ? '✅' : '❌'} · WhatsApp: {profile.notificationPreferences?.whatsapp ? '✅' : '❌'}</p>
            </div>
          </div>
          <Link to="/profile/notifications" className="text-sm text-primary hover:text-primary-hover font-medium">Edit</Link>
        </div>
      </div>
    </div>
  );
}
