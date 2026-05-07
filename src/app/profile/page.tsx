'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
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
      <WebLayout title="Profil">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-text-muted mb-4">Daxil olmaq lazımdır</p>
          <Button onClick={() => router.push(ROUTES.login)}>Daxil ol</Button>
        </div>
      </WebLayout>
    );
  }

  const userReviews = reviews.filter((r) => r.targetUserId === currentUser.id);

  const startEdit = () => {
    setForm({ fullName: currentUser.fullName, phone: currentUser.phone, city: currentUser.city, bio: currentUser.bio || '' });
    setEditing(true);
  };
  const saveEdit = () => { updateProfile(form); setEditing(false); };

  return (
    <WebLayout title="Profil" narrow>
      <div className="stagger-children">
        <div className="flex justify-end mb-4"><RoleSwitch /></div>
        <ProfileHeader user={currentUser} reviewsCount={userReviews.length} />
        {currentUser.bio && !editing && (<Card padding="md" className="mb-4 mt-4"><p className="text-sm text-text-secondary">{currentUser.bio}</p></Card>)}
        {editing ? (
          <Card className="mb-4 mt-4">
            <div className="flex flex-col gap-4">
              <Input label="Ad" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
              <Input label="Telefon" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Şəhər</label>
                <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seçin</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Haqqımda" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              <div className="flex gap-3"><Button fullWidth onClick={saveEdit}>Yadda saxla</Button><Button fullWidth variant="ghost" onClick={() => setEditing(false)}>Ləğv et</Button></div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 mt-4">
            <Button variant="outline" onClick={startEdit}><Settings size={16} /> Profili redaktə et</Button>
            {currentUser.role === 'admin' && (<Button variant="secondary" onClick={() => router.push(ROUTES.admin)}><Shield size={16} /> Admin panel</Button>)}
          </div>
        )}
        {userReviews.length > 0 && (<div><h3 className="text-lg font-semibold text-text mb-3">Rəylər</h3><div className="grid sm:grid-cols-2 gap-3">{userReviews.map((r) => (<ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />))}</div></div>)}
        <Button variant="ghost" className="mt-8 text-danger-500" onClick={() => { logout(); router.push('/'); }}><LogOut size={16} /> Çıxış</Button>
      </div>
    </WebLayout>
  );
}
