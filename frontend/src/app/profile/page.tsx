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

const PROFILE_I18N = {
  az: {
    title: 'Profil',
    authRequired: 'Daxil olmaq lazımdır',
    loginBtn: 'Daxil ol',
    nameLabel: 'Ad',
    phoneLabel: 'Telefon',
    cityLabel: 'Şəhər',
    selectCity: 'Seçin',
    bioPlaceholder: 'Haqqımda',
    saveBtn: 'Yadda saxla',
    cancelBtn: 'Ləğv et',
    editProfileBtn: 'Profili redaktə et',
    adminPanelBtn: 'Admin panel',
    reviewsTitle: 'Rəylər',
    logoutBtn: 'Çıxış',
    verificationTitle: 'Sürücü Təsdiqləməsi',
    uploadSuccess: 'Sənəd uğurla göndərildi! Admin təsdiqləməsini gözləyin.',
    uploadError: 'Yükləmə zamanı xəta baş verdi.',
    statusNone: 'Təsdiqlənməyib',
    statusPending: 'Gözləyir',
    statusApproved: 'Təsdiqlənib',
    statusRejected: 'Rədd edilib',
    verificationDesc: 'Sürücü kimi fəaliyyət göstərmək üçün şəxsiyyət vəsiqənizi və ya sürücülük vəsiqənizi yükləyərək hesabınızı təsdiqləməlisiniz.',
    clickToUpload: 'Sənədi seçmək üçün klikləyin',
    uploadLimits: 'JPG, PNG və ya PDF (maks. 5MB)',
    submitVerificationBtn: 'Təsdiqləmə üçün göndər',
    pendingDesc: 'Sənədiniz göndərilib və admin tərəfindən yoxlanılır. Bu proses 24 saat ərzində tamamlana bilər.',
    approvedDesc: 'Hesabınız tam təsdiqlənib. Artıq gedişlər yarada bilərsiniz!',
  },
  ru: {
    title: 'Профиль',
    authRequired: 'Необходимо войти в систему',
    loginBtn: 'Войти',
    nameLabel: 'Имя',
    phoneLabel: 'Телефон',
    cityLabel: 'Город',
    selectCity: 'Выберите',
    bioPlaceholder: 'О себе',
    saveBtn: 'Сохранить',
    cancelBtn: 'Отмена',
    editProfileBtn: 'Редактировать профиль',
    adminPanelBtn: 'Панель администратора',
    reviewsTitle: 'Отзывы',
    logoutBtn: 'Выйти',
    verificationTitle: 'Подтверждение водителя',
    uploadSuccess: 'Документ успешно отправлен! Ожидайте одобрения администратора.',
    uploadError: 'Произошла ошибка при загрузке.',
    statusNone: 'Не подтверждено',
    statusPending: 'На проверке',
    statusApproved: 'Подтверждено',
    statusRejected: 'Отклонено',
    verificationDesc: 'Для работы водителем необходимо подтвердить свой аккаунт, загрузив удостоверение личности или водительское удостоверение.',
    clickToUpload: 'Нажмите, чтобы выбрать документ',
    uploadLimits: 'JPG, PNG или PDF (макс. 5МБ)',
    submitVerificationBtn: 'Отправить на подтверждение',
    pendingDesc: 'Ваш документ отправлен и находится на проверке у администратора. Этот процесс может занять до 24 часов.',
    approvedDesc: 'Ваш аккаунт полностью подтвержден. Теперь вы можете создавать поездки!',
  },
  en: {
    title: 'Profile',
    authRequired: 'Authentication required',
    loginBtn: 'Log in',
    nameLabel: 'Name',
    phoneLabel: 'Phone',
    cityLabel: 'City',
    selectCity: 'Select',
    bioPlaceholder: 'About me',
    saveBtn: 'Save changes',
    cancelBtn: 'Cancel',
    editProfileBtn: 'Edit profile',
    adminPanelBtn: 'Admin dashboard',
    reviewsTitle: 'Reviews',
    logoutBtn: 'Log out',
    verificationTitle: 'Driver Verification',
    uploadSuccess: 'Document submitted successfully! Awaiting admin approval.',
    uploadError: 'An error occurred during upload.',
    statusNone: 'Not verified',
    statusPending: 'Pending',
    statusApproved: 'Verified',
    statusRejected: 'Rejected',
    verificationDesc: 'To act as a driver, you must verify your account by uploading your ID or driving license.',
    clickToUpload: 'Click to select a document',
    uploadLimits: 'JPG, PNG or PDF (max 5MB)',
    submitVerificationBtn: 'Submit for verification',
    pendingDesc: 'Your document has been submitted and is being reviewed by an admin. This process may take up to 24 hours.',
    approvedDesc: 'Your account is fully verified. You can now create trips!',
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, reviews, users, logout, updateProfile, isAuthenticated, language } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', city: '', bio: '' });

  const copy = PROFILE_I18N[language] || PROFILE_I18N.en;

  if (!isAuthenticated || !currentUser) {
    return (
      <WebLayout title={copy.title}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-text-muted mb-4">{copy.authRequired}</p>
          <Button onClick={() => router.push(ROUTES.login)}>{copy.loginBtn}</Button>
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
    <WebLayout title={copy.title} narrow>
      <div className="stagger-children">
        <div className="flex justify-end mb-4"><RoleSwitch /></div>
        <ProfileHeader user={currentUser} reviewsCount={userReviews.length} />
        {currentUser.bio && !editing && (<Card padding="md" className="mb-4 mt-4"><p className="text-sm text-text-secondary">{currentUser.bio}</p></Card>)}
        {editing ? (
          <Card className="mb-4 mt-4">
            <div className="flex flex-col gap-4">
              <Input label={copy.nameLabel} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
              <Input label={copy.phoneLabel} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">{copy.cityLabel}</label>
                <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">{copy.selectCity}</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} placeholder={copy.bioPlaceholder} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              <div className="flex gap-3"><Button fullWidth onClick={saveEdit}>{copy.saveBtn}</Button><Button fullWidth variant="ghost" onClick={() => setEditing(false)}>{copy.cancelBtn}</Button></div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 mt-4">
            <Button variant="outline" onClick={startEdit}><Icon name="settings" size={16} /> {copy.editProfileBtn}</Button>
            {currentUser.role === 'admin' && (<Button variant="secondary" onClick={() => router.push(ROUTES.admin)}><Icon name="shield" size={16} /> {copy.adminPanelBtn}</Button>)}
          </div>
        )}

        <DriverVerificationSection copy={copy} />
        {userReviews.length > 0 && (<div><h3 className="text-lg font-semibold text-text mb-3">{copy.reviewsTitle}</h3><div className="grid sm:grid-cols-2 gap-3">{userReviews.map((r) => (<ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />))}</div></div>)}
        <Button variant="ghost" className="mt-8 text-danger-500" onClick={() => { logout(); router.push('/'); }}><Icon name="log-out" size={16} /> {copy.logoutBtn}</Button>
      </div>
    </WebLayout>
  );
}

interface VerificationSectionProps {
  copy: typeof PROFILE_I18N['az'];
}

function DriverVerificationSection({ copy }: VerificationSectionProps) {
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
      alert(copy.uploadSuccess);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert(copy.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const statusMap = {
    none: { label: copy.statusNone, color: 'bg-surface-muted text-text-muted', icon: 'shield' },
    pending: { label: copy.statusPending, color: 'bg-warn-50 text-warn-600', icon: 'clock' },
    approved: { label: copy.statusApproved, color: 'bg-success-50 text-success-600', icon: 'shield-check' },
    rejected: { label: copy.statusRejected, color: 'bg-danger-50 text-danger-600', icon: 'shield-x' },
  } satisfies Record<string, { label: string; color: string; icon: IconName }>;

  const currentStatus = statusMap[currentUser.verificationStatus || 'none'];

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text">{copy.verificationTitle}</h3>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentStatus.color}`}>
          <Icon name={currentStatus.icon} size={14} />
          {currentStatus.label}
        </div>
      </div>

      {currentUser.verificationStatus === 'none' || currentUser.verificationStatus === 'rejected' ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {copy.verificationDesc}
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
                  <p className="text-sm">{copy.clickToUpload}</p>
                  <p className="text-xs mt-1">{copy.uploadLimits}</p>
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
            {copy.submitVerificationBtn}
          </Button>
        </div>
      ) : currentUser.verificationStatus === 'pending' ? (
        <p className="text-sm text-text-secondary italic">
          {copy.pendingDesc}
        </p>
      ) : (
        <div className="flex items-center gap-3 text-success-600 bg-success-50 p-4 rounded-xl">
          <Icon name="check-circle" size={20} />
          <p className="text-sm font-medium">{copy.approvedDesc}</p>
        </div>
      )}
    </Card>
  );
}
