import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, ShieldCheck, ShieldOff, Bell, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/profile').then((r) => {
      const data = r.data.data;
      setProfile(data);
      // Sync isVerified from backend to context
      if (data && user && data.isVerified !== user.isVerified) {
        updateUser({ isVerified: data.isVerified });
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-2xl mx-auto space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Could not load profile</div>;

  const isVerified = user?.isVerified ?? profile?.isVerified ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your account information</p>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {profile.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{profile.name}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{profile.role?.toLowerCase()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-1">
          {[
            { icon: User, label: 'Name', value: profile.name },
            { icon: Mail, label: 'Email', value: profile.email },
            { icon: Phone, label: 'Phone', value: profile.phone },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center"><Icon size={16} className="text-muted-foreground" /></div>
              <div className="flex-1"><p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p><p className="text-sm font-medium mt-0.5">{value}</p></div>
            </div>
          ))}

          {/* Verification Status */}
          <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
            <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center">
              {isVerified ? (
                <ShieldCheck size={16} className="text-emerald-500" />
              ) : (
                <ShieldOff size={16} className="text-destructive" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Verification Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={15} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <XCircle size={15} />
                    Not Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center"><Bell size={16} className="text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-semibold">Notification Preferences</p>
                <p className="text-xs text-muted-foreground">
                  Email: {profile.notificationPreferences?.email ? '✅' : '❌'} · 
                  SMS: {profile.notificationPreferences?.sms ? '✅' : '❌'} · 
                  WhatsApp: {profile.notificationPreferences?.whatsapp ? '✅' : '❌'}
                </p>
              </div>
            </div>
            <Link to="/profile/notifications"><Button variant="outline" size="sm">Edit</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
