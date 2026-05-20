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
import Icon, { type IconName } from '@/components/ui/Icon';

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
            <Button variant="outline" onClick={startEdit}><Icon name="settings" size={16} /> Profili redaktə et</Button>
            {currentUser.role === 'admin' && (<Button variant="secondary" onClick={() => router.push(ROUTES.admin)}><Icon name="shield" size={16} /> Admin panel</Button>)}
          </div>
        )}

        <DriverVerificationSection />
        {userReviews.length > 0 && (<div><h3 className="text-lg font-semibold text-text mb-3">Rəylər</h3><div className="grid sm:grid-cols-2 gap-3">{userReviews.map((r) => (<ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />))}</div></div>)}
        <Button variant="ghost" className="mt-8 text-danger-500" onClick={() => { logout(); router.push('/'); }}><Icon name="log-out" size={16} /> Çıxış</Button>
      </div>
    </WebLayout>
  );
}

function DriverVerificationSection() {
  const { currentUser, submitVerification } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await submitVerification(file);
      alert('Sənəd uğurla göndərildi! Admin təsdiqləməsini gözləyin.');
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Yükləmə zamanı xəta baş verdi.');
    } finally {
      setUploading(false);
    }
  };

  const statusMap = {
    none: { label: 'Təsdiqlənməyib', color: 'bg-surface-muted text-text-muted', icon: 'shield' },
    pending: { label: 'Gözləyir', color: 'bg-warn-50 text-warn-600', icon: 'clock' },
    approved: { label: 'Təsdiqlənib', color: 'bg-success-50 text-success-600', icon: 'shield-check' },
    rejected: { label: 'Rədd edilib', color: 'bg-danger-50 text-danger-600', icon: 'shield-x' },
  } satisfies Record<string, { label: string; color: string; icon: IconName }>;

  const currentStatus = statusMap[currentUser.verificationStatus || 'none'];

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text">Sürücü Təsdiqləməsi</h3>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentStatus.color}`}>
          <Icon name={currentStatus.icon} size={14} />
          {currentStatus.label}
        </div>
      </div>

      {currentUser.verificationStatus === 'none' || currentUser.verificationStatus === 'rejected' ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Sürücü kimi fəaliyyət göstərmək üçün şəxsiyyət vəsiqənizi və ya sürücülük vəsiqənizi yükləyərək hesabınızı təsdiqləməlisiniz.
          </p>
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*,.pdf" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center group-hover:border-brand-500 transition-colors">
              {file ? (
                <div className="flex items-center justify-center gap-2 text-brand-600">
                  <Icon name="file-text" size={20} />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <div className="text-text-muted">
                  <Icon name="upload" size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Sənədi seçmək üçün klikləyin</p>
                  <p className="text-xs mt-1">JPG, PNG və ya PDF (maks. 5MB)</p>
                </div>
              )}
            </div>
          </div>
          <Button 
            fullWidth 
            onClick={handleUpload} 
            disabled={!file || uploading}
            loading={uploading}
          >
            Təsdiqləmə üçün göndər
          </Button>
        </div>
      ) : currentUser.verificationStatus === 'pending' ? (
        <p className="text-sm text-text-secondary italic">
          Sənədiniz göndərilib və admin tərəfindən yoxlanılır. Bu proses 24 saat ərzində tamamlana bilər.
        </p>
      ) : (
        <div className="flex items-center gap-3 text-success-600 bg-success-50 p-4 rounded-xl">
          <Icon name="check-circle" size={20} />
          <p className="text-sm font-medium">Hesabınız tam təsdiqlənib. Artıq gedişlər yarada bilərsiniz!</p>
        </div>
      )}
    </Card>
  );
}
