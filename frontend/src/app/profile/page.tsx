'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ReviewCard from '@/components/reviews/ReviewCard';
import RoleSwitch from '@/components/layout/RoleSwitch';
import { BadgesSection } from '@/components/gamification/BadgesSection';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import UserAvatar from '@/components/ui/UserAvatar';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES } from '@/lib/utils';
import Icon, { type IconName } from '@/components/ui/Icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { mapApiVehicleToVehicle, type ApiVehicle } from "@/services/api/mappers";
import type { Vehicle } from '@/types';

const PROFILE_I18N = {
  az: {
    title: 'Profil',
    authRequired: 'Daxil olmaq lazımdır',
    loginBtn: 'Daxil ol',
    nameLabel: 'Ad',
    phoneLabel: 'Telefon',
    emailLabel: 'Email',
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
    updateError: 'Profil yenilənərkən xəta baş verdi.',
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
    vehiclesTitle: 'Avtomobillərim',
    addVehicleBtn: 'Avtomobil əlavə et',
    deleteBtn: 'Sil',
    brandLabel: 'Marka',
    modelLabel: 'Model',
    yearLabel: 'İl',
    colorLabel: 'Rəng',
    plateLabel: 'Nömrə nişanı',
    noVehicles: 'Hələ avtomobil əlavə edilməyib.',
    saveVehicleBtn: 'Yadda saxla',
    emailVerificationTitle: 'Email Təsdiqi',
    emailVerified: 'Email təsdiqlənib',
    emailNotVerified: 'Email təsdiqlənməyib',
    verifyEmailBtn: 'Emaili təsdiqlə',
    emailVerifyDesc: 'Hesabınızın təhlükəsizliyini artırmaq və şifrənizi asanlıqla bərpa etmək üçün emailinizi təsdiqləyin.',
    enterOtpPlaceholder: 'Emailinizə göndərilən kodu daxil edin',
    submitOtpBtn: 'Kodu təsdiqlə',
    emailVerifySuccess: 'Email uğurla təsdiqləndi!',
    emailVerifyError: 'Emaili təsdiqləmək mümkün olmadı.',
    otpSentSuccess: 'Kod emailinizə göndərildi.',
  },
  ru: {
    title: 'Профиль',
    authRequired: 'Необходимо войти в систему',
    loginBtn: 'Войти',
    nameLabel: 'Имя',
    phoneLabel: 'Телефон',
    emailLabel: 'Email',
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
    updateError: 'Произошла ошибка при обновлении профиля.',
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
    vehiclesTitle: 'Мои автомобили',
    addVehicleBtn: 'Добавить автомобиль',
    deleteBtn: 'Удалить',
    brandLabel: 'Марка',
    modelLabel: 'Модель',
    yearLabel: 'Год',
    colorLabel: 'Цвет',
    plateLabel: 'Номер',
    noVehicles: 'Автомобили пока не добавлены.',
    saveVehicleBtn: 'Сохранить',
    emailVerificationTitle: 'Подтверждение Email',
    emailVerified: 'Email подтвержден',
    emailNotVerified: 'Email не подтвержден',
    verifyEmailBtn: 'Подтвердить Email',
    emailVerifyDesc: 'Подтвердите свой email, чтобы повысить безопасность аккаунта и легко восстановить пароль.',
    enterOtpPlaceholder: 'Введите код, отправленный на ваш email',
    submitOtpBtn: 'Подтвердить код',
    emailVerifySuccess: 'Email успешно подтвержден!',
    emailVerifyError: 'Не удалось подтвердить email.',
    otpSentSuccess: 'Код был отправлен на ваш email.',
  },
  en: {
    title: 'Profile',
    authRequired: 'Authentication required',
    loginBtn: 'Log in',
    nameLabel: 'Name',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
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
    updateError: 'Failed to update profile.',
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
    vehiclesTitle: 'My Vehicles',
    addVehicleBtn: 'Add vehicle',
    deleteBtn: 'Delete',
    brandLabel: 'Brand',
    modelLabel: 'Model',
    yearLabel: 'Year',
    colorLabel: 'Color',
    plateLabel: 'Plate Number',
    noVehicles: 'No vehicles added yet.',
    saveVehicleBtn: 'Save',
    emailVerificationTitle: 'Email Verification',
    emailVerified: 'Email is verified',
    emailNotVerified: 'Email is not verified',
    verifyEmailBtn: 'Verify Email',
    emailVerifyDesc: 'Verify your email to enhance account security and recover your password easily.',
    enterOtpPlaceholder: 'Enter OTP sent to your email',
    submitOtpBtn: 'Confirm OTP',
    emailVerifySuccess: 'Email verified successfully!',
    emailVerifyError: 'Failed to verify email.',
    otpSentSuccess: 'OTP has been sent to your email.',
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, reviews, users, logout, updateProfile, fetchReviews, clearError, lastError, isAuthenticated, language } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', city: '', bio: '', avatarUrl: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      useAppStore.setState({ lastError: 'Yalnız şəkil formatı (JPG, PNG və s.) qəbul edilir.' });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((p) => ({ ...p, avatarUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const copy = PROFILE_I18N[language] || PROFILE_I18N.en;

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      void fetchReviews(currentUser.id);
    }
  }, [isAuthenticated, currentUser, fetchReviews]);

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
    setForm({ fullName: currentUser.fullName, phone: currentUser.phone, email: currentUser.email || '', city: currentUser.city, bio: currentUser.bio || '', avatarUrl: currentUser.avatarUrl || '' });
    setEditing(true);
  };
  const saveEdit = async () => {
    setSavingProfile(true);
    setProfileError('');
    clearError();
    try {
      if (avatarFile) {
        await useAppStore.getState().uploadAvatar(avatarFile);
      }
      await updateProfile(form);
      setEditing(false);
      setAvatarFile(null);
    } catch {
      setProfileError(useAppStore.getState().lastError || copy.updateError);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <WebLayout title={copy.title} narrow>
      <div className="stagger-children">
        {(profileError || lastError) && (
          <Card className="mb-4 border border-[#ffdad6] bg-[#fff4f2] text-sm font-medium text-[#93000a]">
            {profileError || lastError}
          </Card>
        )}
        <div className="flex justify-end mb-4"><RoleSwitch /></div>
        <ProfileHeader user={currentUser} reviewsCount={userReviews.length} />
        
        <div className="mt-4">
          <BadgesSection />
        </div>

        {currentUser.bio && !editing && (<Card padding="md" className="mb-4 mt-4"><p className="text-sm text-text-secondary">{currentUser.bio}</p></Card>)}
        {editing ? (
          <Card className="mb-4 mt-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 mb-2">
                <UserAvatar 
                  name={form.fullName || currentUser.fullName} 
                  avatarUrl={form.avatarUrl || currentUser.avatarUrl} 
                  size={64} 
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="camera" size={16} /> Şəkil yüklə
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </div>
              <Input label={copy.nameLabel} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
              <Input label={copy.phoneLabel} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <Input label={copy.emailLabel || 'Email'} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} type="email" />
              <Select
                label={copy.cityLabel}
                value={form.city}
                onChange={(val) => setForm((p) => ({ ...p, city: String(val) }))}
                options={AZ_CITIES}
                placeholder={copy.selectCity}
                searchable
              />
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} placeholder={copy.bioPlaceholder} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              <div className="flex gap-3"><Button className="flex-1" onClick={saveEdit} loading={savingProfile}>{copy.saveBtn}</Button><Button className="flex-1" variant="ghost" onClick={() => setEditing(false)} disabled={savingProfile}>{copy.cancelBtn}</Button></div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 mt-4">
            <Button variant="outline" onClick={startEdit}><Icon name="settings" size={16} /> {copy.editProfileBtn}</Button>
            {currentUser.role === 'admin' && (<Button variant="secondary" onClick={() => router.push(ROUTES.admin)}><Icon name="shield" size={16} /> {copy.adminPanelBtn}</Button>)}
          </div>
        )}

        <EmailVerificationSection copy={copy} />
        <DriverVerificationSection copy={copy} />
        <DriverVehiclesSection copy={copy} isDriver={currentUser.role !== 'admin'} />
        {userReviews.length > 0 && (<div><h3 className="text-lg font-semibold text-text mb-3">{copy.reviewsTitle}</h3><div className="grid sm:grid-cols-2 gap-3">{userReviews.map((r) => (<ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />))}</div></div>)}
        <Button variant="ghost" className="mt-8 text-danger-500" onClick={() => { logout(); router.push('/'); }}><Icon name="log-out" size={16} /> {copy.logoutBtn}</Button>
      </div>
    </WebLayout>
  );
}

interface VerificationSectionProps {
  copy: typeof PROFILE_I18N['az'];
}

type ProfileCopy = typeof PROFILE_I18N['az'];
type FocusableRef = React.RefObject<{ focus: () => void } | null>;

interface VehiclePayload {
  brand: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
}

function EmailVerificationSection({ copy }: VerificationSectionProps) {
  const { currentUser, requestEmailVerification, verifyEmail } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  if (!currentUser || !currentUser.email) return null;

  const handleRequest = async () => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    const success = await requestEmailVerification();
    if (success) {
      setShowOtp(true);
      setMsg({ type: 'success', text: copy.otpSentSuccess });
    } else {
      setMsg({ type: 'error', text: useAppStore.getState().lastError || copy.emailVerifyError });
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    setMsg({ type: '', text: '' });
    const success = await verifyEmail(otp);
    if (success) {
      setMsg({ type: 'success', text: copy.emailVerifySuccess });
      setShowOtp(false);
    } else {
      setMsg({ type: 'error', text: useAppStore.getState().lastError || copy.emailVerifyError });
    }
    setLoading(false);
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text">{copy.emailVerificationTitle}</h3>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentUser.isEmailVerified ? 'bg-success-50 text-success-600' : 'bg-warn-50 text-warn-600'}`}>
          <Icon name={currentUser.isEmailVerified ? 'check-circle' : 'alert-triangle'} size={14} />
          {currentUser.isEmailVerified ? copy.emailVerified : copy.emailNotVerified}
        </div>
      </div>

      {!currentUser.isEmailVerified && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{copy.emailVerifyDesc}</p>
          <div className="text-sm font-medium text-text bg-surface-muted p-3 rounded-lg flex items-center justify-between">
            <span>{currentUser.email}</span>
          </div>

          {msg.text && (
            <div className={`p-3 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
              {msg.text}
            </div>
          )}

          {!showOtp ? (
            <Button fullWidth onClick={handleRequest} loading={loading}>
              {copy.verifyEmailBtn}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder={copy.enterOtpPlaceholder}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="flex-1"
              />
              <Button onClick={handleVerify} loading={loading} disabled={otp.length < 6}>
                {copy.submitOtpBtn}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
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

import { CAR_BRANDS_MODELS, CAR_COLORS_LOCALIZED, CAR_YEARS, getLocalizedColor } from '@/data/cars';

const AZ_REGIONS = [
  { code: '01', name: 'Abşeron' },
  { code: '02', name: 'Ağdam' },
  { code: '03', name: 'Ağdaş' },
  { code: '04', name: 'Ağcabədi' },
  { code: '05', name: 'Ağstafa' },
  { code: '06', name: 'Ağsu' },
  { code: '07', name: 'Astara' },
  { code: '08', name: 'Balakən' },
  { code: '09', name: 'Bərdə' },
  { code: '10', name: 'Bakı' },
  { code: '11', name: 'Beyləqan' },
  { code: '12', name: 'Biləsuvar' },
  { code: '14', name: 'Cəbrayıl' },
  { code: '15', name: 'Cəlilabad' },
  { code: '16', name: 'Daşkəsən' },
  { code: '17', name: 'Şabran' },
  { code: '18', name: 'Şirvan' },
  { code: '19', name: 'Füzuli' },
  { code: '20', name: 'Gəncə' },
  { code: '21', name: 'Gədəbəy' },
  { code: '22', name: 'Goranboy' },
  { code: '23', name: 'Göyçay' },
  { code: '24', name: 'Hacıqabul' },
  { code: '25', name: 'Göygöl' },
  { code: '26', name: 'Xankəndi' },
  { code: '27', name: 'Xaçmaz' },
  { code: '28', name: 'Xocavənd' },
  { code: '29', name: 'Xızı' },
  { code: '30', name: 'İmişli' },
  { code: '31', name: 'İsmayıllı' },
  { code: '32', name: 'Kəlbəcər' },
  { code: '33', name: 'Kürdəmir' },
  { code: '34', name: 'Qax' },
  { code: '35', name: 'Qazax' },
  { code: '36', name: 'Qəbələ' },
  { code: '37', name: 'Qobustan' },
  { code: '38', name: 'Qusar' },
  { code: '39', name: 'Qubadlı' },
  { code: '40', name: 'Quba' },
  { code: '41', name: 'Laçın' },
  { code: '42', name: 'Lənkəran' },
  { code: '43', name: 'Lerik' },
  { code: '44', name: 'Masallı' },
  { code: '45', name: 'Mingəçevir' },
  { code: '46', name: 'Naftalan' },
  { code: '47', name: 'Neftçala' },
  { code: '48', name: 'Oğuz' },
  { code: '49', name: 'Saatlı' },
  { code: '50', name: 'Sumqayıt' },
  { code: '51', name: 'Samux' },
  { code: '52', name: 'Salyan' },
  { code: '53', name: 'Siyəzən' },
  { code: '54', name: 'Sabirabad' },
  { code: '55', name: 'Şəki' },
  { code: '56', name: 'Şamaxı' },
  { code: '57', name: 'Şəmkir' },
  { code: '58', name: 'Şuşa' },
  { code: '59', name: 'Tərtər' },
  { code: '60', name: 'Tovuz' },
  { code: '61', name: 'Ucar' },
  { code: '62', name: 'Zaqatala' },
  { code: '63', name: 'Zərdab' },
  { code: '64', name: 'Zəngilan' },
  { code: '65', name: 'Yardımlı' },
  { code: '66', name: 'Yevlax' },
  { code: '67', name: 'Babək' },
  { code: '68', name: 'Şərur' },
  { code: '69', name: 'Ordubad' },
  { code: '70', name: 'Naxçıvan' },
  { code: '71', name: 'Şahbuz' },
  { code: '72', name: 'Culfa' },
  { code: '77', name: 'Bakı' },
  { code: '85', name: 'Naxçıvan' },
  { code: '90', name: 'Bakı' },
  { code: '99', name: 'Bakı' }
];

const AZ_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N',
  'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z'
];

interface CustomPlateDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  widthClass: string;
  dropdownWidthClass?: string;
  nextRef?: FocusableRef;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  plateMode?: boolean;
}

function CustomPlateDropdown({
  value,
  onChange,
  options,
  placeholder,
  widthClass,
  dropdownWidthClass = 'w-full',
  nextRef,
  buttonRef,
  plateMode = false
}: CustomPlateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    if (nextRef && nextRef.current) {
      setTimeout(() => {
        nextRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center ${widthClass}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={plateMode
          ? "w-full bg-transparent border-none text-2xl font-black text-slate-900 focus:outline-none flex items-center justify-center h-10 select-none cursor-pointer font-mono tracking-wider"
          : "relative w-full bg-white border border-gray-300 hover:border-gray-400 rounded-lg px-2 py-2 text-sm font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center justify-center h-10 transition-colors"
        }
      >
        <span className="truncate">
          {value || <span className={plateMode ? "text-slate-300 font-normal" : "text-gray-400 font-normal"}>{placeholder}</span>}
        </span>
        {!plateMode && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 py-1 ${dropdownWidthClass}`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full px-3 py-1.5 text-sm text-left hover:bg-slate-50 hover:text-brand-600 transition-colors block ${
                value === opt.value ? 'bg-brand-50/50 text-brand-600 font-bold' : 'text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AzerbaijanPlateBadge({ plateNumber }: { plateNumber: string }) {
  const clean = plateNumber.replace(/[\s-]/g, '').toUpperCase();
  const match = clean.match(/^(\d{2})([A-Z]{2})(\d{3})$/);
  
  let reg = '';
  let letters = '';
  let num = '';
  let isValid = false;
  
  if (match) {
    reg = match[1];
    letters = match[2];
    num = match[3];
    isValid = true;
  } else {
    const match1 = clean.match(/^(\d{2})([A-Z]{1})(\d{3})$/);
    if (match1) {
      reg = match1[1];
      letters = match1[2];
      num = match1[3];
      isValid = true;
    }
  }

  return (
    <div className="inline-flex items-center bg-white border-2 border-slate-900 rounded-[6px] px-1 py-0.5 shadow-sm select-none h-[28px] gap-1 font-mono text-sm font-black text-slate-900 shrink-0">
      <div className="flex flex-col items-center justify-center bg-white w-[20px] h-[22px] shrink-0 leading-none" style={{ width: '22px' }}>
        <div className="w-[18px] h-[9px] overflow-hidden rounded-[1px] border border-slate-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="100%" height="100%">
            <rect width="60" height="10" fill="#00b5e2"/>
            <rect y="10" width="60" height="10" fill="#ef3340"/>
            <rect y="20" width="60" height="10" fill="#50b848"/>
            <circle cx="30" cy="15" r="3.5" fill="#fff"/>
            <circle cx="31.5" cy="15" r="2.8" fill="#ef3340"/>
            <polygon points="32.5,13.5 33,14.6 34.2,14.6 33.2,15.3 33.6,16.5 32.5,15.8 31.4,16.5 31.8,15.3 30.8,14.6 32,14.6" fill="#fff"/>
          </svg>
        </div>
        <span className="text-[6.5px] font-black text-slate-900 mt-[1px]" style={{ transform: 'scale(0.85)' }}>AZ</span>
      </div>

      <div className="w-[1px] h-4 bg-slate-300 mx-[1px] shrink-0" />

      {isValid ? (
        <div className="flex items-center gap-1 font-mono tracking-wider font-extrabold text-[13px]">
          <span>{reg}</span>
          <span>{letters}</span>
          <span>{num}</span>
        </div>
      ) : (
        <span className="font-mono text-[13px] font-extrabold tracking-wide">{plateNumber}</span>
      )}
    </div>
  );
}

function AnimatedAlertModal({ isOpen, message, onClose }: { isOpen: boolean, message: string, onClose: () => void }) {
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (isOpen) {
      timers.push(setTimeout(() => setRender(true), 0));
      timers.push(setTimeout(() => setShow(true), 10));
    } else {
      timers.push(setTimeout(() => setShow(false), 0));
      timers.push(setTimeout(() => setRender(false), 300));
    }

    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  if (!render) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${show ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden transition-all duration-300 ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}>
        <div className="p-6 text-center flex flex-col items-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-danger-50 mb-4">
            <Icon name="alert-triangle" size={28} className="text-danger-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Внимание</h3>
          <p className="text-sm text-slate-600 mb-6">{message}</p>
          <Button fullWidth onClick={onClose}>Понятно</Button>
        </div>
      </div>
    </div>
  );
}

function DriverVehiclesSection({ copy, isDriver }: { copy: ProfileCopy, isDriver: boolean }) {
  const { language } = useAppStore();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ brand: '', model: '', year: new Date().getFullYear(), color: '' });
  const [plateReg, setPlateReg] = useState('');
  const [plateLet1, setPlateLet1] = useState('');
  const [plateLet2, setPlateLet2] = useState('');
  const [plateNum, setPlateNum] = useState('');

  const letter1Ref = useRef<HTMLButtonElement>(null);
  const letter2Ref = useRef<HTMLButtonElement>(null);
  const plateNumRef = useRef<HTMLInputElement>(null);

  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '' });

  const showAlert = (message: string) => {
    setAlertInfo({ isOpen: true, message });
  };
  const closeAlert = () => {
    setAlertInfo({ isOpen: false, message: '' });
  };

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['my-vehicles'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiVehicle[]>('/vehicles/my');
        return response.map(mapApiVehicleToVehicle);
      } catch {
        return [];
      }
    },
    enabled: isDriver
  });

  const addMutation = useMutation({
    mutationFn: async (data: VehiclePayload) => apiClient.post('/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      setAdding(false);
      setForm({ brand: '', model: '', year: new Date().getFullYear(), color: '' });
      setPlateReg('');
      setPlateLet1('');
      setPlateLet2('');
      setPlateNum('');
    }
  });

  const colorOptions = React.useMemo(() => {
    return CAR_COLORS_LOCALIZED.map(c => ({
      value: c.value,
      label: c.label[language] || c.label.en
    }));
  }, [language]);

  const handleSave = () => {
    if (!form.brand || !form.model || !form.color || !form.year) {
      showAlert("Пожалуйста, заполните марку, модель, год и цвет автомобиля.");
      return;
    }
    const reg = plateReg.trim();
    const l1 = plateLet1.trim();
    const l2 = plateLet2.trim();
    const num = plateNum.trim();
    if (reg.length !== 2 || l1.length !== 1 || l2.length !== 1 || num.length !== 3) {
      showAlert("Пожалуйста, введите корректный номер автомобиля (например, 99-XX-123).");
      return;
    }
    const letters = `${l1}${l2}`;
    const fullPlate = `${reg}-${letters}-${num}`.toUpperCase();
    
    addMutation.mutate({
      brand: form.brand,
      model: form.model,
      year: form.year,
      color: form.color,
      plate_number: fullPlate
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/vehicles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-vehicles'] })
  });

  if (!isDriver) return null;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text">{copy.vehiclesTitle}</h3>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Icon name="plus" size={14} /> <span className="hidden sm:inline ml-1">{copy.addVehicleBtn}</span>
          </Button>
        )}
      </div>

      {adding ? (
        <div className="grid gap-4 sm:grid-cols-2 mb-4 bg-surface-muted p-5 rounded-2xl border border-border/50">
          <Select
            label={copy.brandLabel || 'Марка'}
            value={form.brand}
            onChange={(val) => setForm({ ...form, brand: String(val), model: '' })}
            options={Object.keys(CAR_BRANDS_MODELS).sort()}
            placeholder={language === 'az' ? 'Marka seçin' : language === 'ru' ? 'Выберите марку' : 'Select brand'}
            searchable
          />

          <Select
            label={copy.modelLabel || 'Модель'}
            value={form.model}
            onChange={(val) => setForm({ ...form, model: String(val) })}
            options={form.brand ? CAR_BRANDS_MODELS[form.brand] || [] : []}
            placeholder={language === 'az' ? 'Model seçin' : language === 'ru' ? 'Выберите модель' : 'Select model'}
            disabled={!form.brand}
            searchable
          />

          <Select
            label={copy.yearLabel || 'Год'}
            value={form.year}
            onChange={(val) => setForm({ ...form, year: Number(val) })}
            options={CAR_YEARS}
            placeholder={language === 'az' ? 'İl seçin' : language === 'ru' ? 'Выберите год' : 'Select year'}
          />

          <Select
            label={copy.colorLabel || 'Цвет'}
            value={form.color}
            onChange={(val) => setForm({ ...form, color: String(val) })}
            options={colorOptions}
            placeholder={language === 'az' ? 'Rəng seçin' : language === 'ru' ? 'Выберите цвет' : 'Select color'}
          />
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-text mb-2">{copy.plateLabel}</label>
            <div className="flex justify-center py-4 bg-white rounded-xl border border-border">
              <div 
                className="relative flex items-center bg-white border-2 border-slate-900 rounded-md px-3 shadow-sm select-none gap-2"
                style={{ width: '330px', height: '56px' }}
              >
                {/* SVG flag badge AZ */}
                <div className="flex flex-col items-center justify-center bg-white w-[22px] h-[40px] shrink-0">
                  <div className="w-[22px] h-[11px] overflow-hidden rounded-[1px] border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="100%" height="100%">
                      <rect width="60" height="10" fill="#00b5e2"/>
                      <rect y="10" width="60" height="10" fill="#ef3340"/>
                      <rect y="20" width="60" height="10" fill="#50b848"/>
                      <circle cx="30" cy="15" r="3.5" fill="#fff"/>
                      <circle cx="31.5" cy="15" r="2.8" fill="#ef3340"/>
                      <polygon points="32.5,13.5 33,14.6 34.2,14.6 33.2,15.3 33.6,16.5 32.5,15.8 31.4,16.5 31.8,15.3 30.8,14.6 32,14.6" fill="#fff"/>
                    </svg>
                  </div>
                  <span className="text-[9px] font-black text-black tracking-widest mt-0.5 leading-none" style={{ transform: 'scale(0.95)' }}>AZ</span>
                </div>

                <div className="w-[1.5px] h-8 bg-slate-300 mx-1 shrink-0" />

                <div className="flex items-center gap-1 font-mono text-2xl font-black text-slate-900 tracking-wider w-full justify-between">
                  {/* Region code */}
                  <CustomPlateDropdown
                    value={plateReg}
                    onChange={setPlateReg}
                    options={AZ_REGIONS.map(r => ({ value: r.code, label: `${r.code} - ${r.name}` }))}
                    placeholder="00"
                    widthClass="w-[50px]"
                    dropdownWidthClass="w-56"
                    nextRef={letter1Ref}
                    plateMode
                  />
                  
                  <span className="text-slate-400 font-normal select-none">-</span>

                  {/* Letter 1 */}
                  <CustomPlateDropdown
                    value={plateLet1}
                    onChange={setPlateLet1}
                    options={AZ_LETTERS.map(l => ({ value: l, label: l }))}
                    placeholder="-"
                    widthClass="w-10"
                    dropdownWidthClass="w-16"
                    nextRef={letter2Ref}
                    buttonRef={letter1Ref}
                    plateMode
                  />

                  {/* Letter 2 */}
                  <CustomPlateDropdown
                    value={plateLet2}
                    onChange={setPlateLet2}
                    options={AZ_LETTERS.map(l => ({ value: l, label: l }))}
                    placeholder="-"
                    widthClass="w-10"
                    dropdownWidthClass="w-16"
                    nextRef={plateNumRef}
                    buttonRef={letter2Ref}
                    plateMode
                  />

                  <span className="text-slate-400 font-normal select-none">-</span>

                  {/* Numbers */}
                  <div className="w-16">
                    <input
                      ref={plateNumRef}
                      type="text"
                      value={plateNum}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setPlateNum(val);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && plateNum === '') {
                          letter2Ref.current?.focus();
                        }
                      }}
                      placeholder="000"
                      className="w-full bg-transparent border-none p-0 text-2xl font-black text-center text-slate-900 focus:outline-none font-mono h-10 placeholder-slate-300 uppercase tracking-widest"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2 flex gap-3 mt-4">
            <Button onClick={handleSave} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Сохранение...' : copy.saveVehicleBtn}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>{copy.cancelBtn}</Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-text-muted">...</p>
      ) : vehicles.length === 0 && !adding ? (
        <p className="text-sm text-text-muted italic">{copy.noVehicles}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {vehicles.map(v => (
            <div key={v.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-text text-base">{v.brand} {v.model}</p>
                  <p className="text-xs text-text-muted">{v.year} • {getLocalizedColor(v.color, language)}</p>
                </div>
                <AzerbaijanPlateBadge plateNumber={v.plateNumber} />
              </div>
              <Button size="sm" variant="ghost" className="text-danger-500 hover:bg-danger-50 rounded-full h-9 w-9 p-0 flex items-center justify-center" onClick={() => { if(confirm('Are you sure?')) deleteMutation.mutate(v.id) }}>
                <Icon name="trash-2" size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AnimatedAlertModal 
        isOpen={alertInfo.isOpen} 
        message={alertInfo.message} 
        onClose={closeAlert} 
      />
    </Card>
  );
}
