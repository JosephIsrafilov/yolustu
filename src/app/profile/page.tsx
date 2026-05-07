'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/layout/MobileShell';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ReviewCard from '@/components/reviews/ReviewCard';
import RoleSwitch from '@/components/layout/RoleSwitch';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES } from '@/lib/utils';
import { LogOut, Settings, Shield } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, reviews, users, logout, updateProfile, isAuthenticated } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', city: '', bio: '' });

  if (!isAuthenticated || !currentUser) {
    return (
      <MobileShell title="Profil" showNav={true}>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-text-muted mb-4">Daxil olmaq lazımdır</p>
          <Button onClick={() => router.push(ROUTES.login)}>Daxil ol</Button>
        </div>
      </MobileShell>
    );
  }

  const userReviews = reviews.filter((r) => r.targetUserId === currentUser.id);

  const startEdit = () => {
    setForm({ fullName: currentUser.fullName, phone: currentUser.phone, city: currentUser.city, bio: currentUser.bio || '' });
    setEditing(true);
  };
  const saveEdit = () => { updateProfile(form); setEditing(false); };

  return (
    <MobileShell title="Profil" rightAction={<RoleSwitch />}>
      <div className="px-4 pb-4 stagger-children">
        <ProfileHeader user={currentUser} reviewsCount={userReviews.length} />

        {currentUser.bio && !editing && (
          <Card padding="sm" className="mb-3">
            <p className="text-sm text-text-secondary">{currentUser.bio}</p>
          </Card>
        )}

        {editing ? (
          <Card className="mb-3">
            <div className="flex flex-col gap-3">
              <Input label="Ad" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
              <Input label="Telefon" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Şəhər</label>
                <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seçin</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={2} placeholder="Haqqımda" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              <div className="flex gap-2">
                <Button fullWidth onClick={saveEdit}>Yadda saxla</Button>
                <Button fullWidth variant="ghost" onClick={() => setEditing(false)}>Ləğv et</Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            <Button variant="outline" fullWidth onClick={startEdit}><Settings size={16} /> Profili redaktə et</Button>
            {currentUser.role === 'admin' && (
              <Button variant="secondary" fullWidth onClick={() => router.push(ROUTES.admin)}>
                <Shield size={16} /> Admin panel
              </Button>
            )}
          </div>
        )}

        {/* Reviews */}
        {userReviews.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">Rəylər</h3>
            <div className="flex flex-col gap-2">
              {userReviews.map((r) => (
                <ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />
              ))}
            </div>
          </div>
        )}

        <Button variant="ghost" fullWidth className="mt-6 text-danger-500" onClick={() => { logout(); router.push('/'); }}>
          <LogOut size={16} /> Çıxış
        </Button>
      </div>
    </MobileShell>
  );
}
