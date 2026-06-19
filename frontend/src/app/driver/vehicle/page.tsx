'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DriverLayout from '@/components/driver/DriverLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CAR_BRANDS_MODELS, CAR_COLORS_LOCALIZED, CAR_YEARS, getLocalizedColor } from '@/data/cars';
import { vehiclesService } from '@/services';
import type { VehicleInput } from '@/services/contracts/vehicles-service';
import { useAppStore } from '@/store/useAppStore';
import type { Vehicle, VehicleDocument, VehicleDocumentType, VehicleVerificationStatus } from '@/types';

const DOC_TYPES: VehicleDocumentType[] = ['registration', 'insurance', 'inspection'];

const DOC_LABELS: Record<VehicleDocumentType, Record<string, string>> = {
  registration: { az: 'Qeydiyyat şəhadətnaməsi', ru: 'Свидетельство о регистрации', en: 'Registration certificate' },
  insurance:    { az: 'Sığorta polisi',            ru: 'Страховой полис',              en: 'Insurance policy' },
  inspection:   { az: 'Texniki baxış',             ru: 'Технический осмотр',           en: 'Technical inspection' },
};

const STATUS_COPY = {
  none:     { az: 'Təsdiqlənməyib', ru: 'Не подтверждено', en: 'Unverified' },
  pending:  { az: 'Gözləmədə',      ru: 'На рассмотрении', en: 'Pending review' },
  approved: { az: 'Təsdiqlənib',    ru: 'Подтверждено',    en: 'Approved' },
  rejected: { az: 'Rədd edilib',    ru: 'Отклонено',       en: 'Rejected' },
};

const COPY = {
  az: {
    title: 'Avtomobillərim',
    intro: 'Gedişlərdə istifadə etdiyiniz avtomobilləri idarə edin.',
    add: 'Avtomobil əlavə et',
    edit: 'Redaktə et',
    save: 'Yadda saxla',
    cancel: 'Ləğv et',
    setDefault: 'Əsas et',
    deactivate: 'Deaktiv et',
    defaultBadge: 'Əsas',
    activeBadge: 'Aktiv',
    inactiveBadge: 'Deaktiv',
    empty: 'Hələ avtomobil əlavə etməmisiniz.',
    brand: 'Marka',
    model: 'Model',
    year: 'İl',
    color: 'Rəng',
    plate: 'Nömrə nişanı',
    seats: 'Sərnişin yerləri',
    required: 'Bütün sahələri doldurun.',
    docs: 'Sənədlər',
    docsInfo: 'Sürücü kimi gediş yaratmaq üçün bütün sənədlər təsdiqlənməlidir.',
    upload: 'Yüklə',
    uploading: 'Yüklənir...',
    uploadError: 'Yükləmə uğursuz oldu.',
    approved: 'Təsdiqlənib',
    pending: 'Gözləmədə',
    rejected: 'Rədd edilib',
    missing: 'Yüklənməyib',
  },
  ru: {
    title: 'Мои автомобили',
    intro: 'Управляйте автомобилями, которые используете для поездок.',
    add: 'Добавить автомобиль',
    edit: 'Изменить',
    save: 'Сохранить',
    cancel: 'Отмена',
    setDefault: 'Сделать основным',
    deactivate: 'Деактивировать',
    defaultBadge: 'Основной',
    activeBadge: 'Активен',
    inactiveBadge: 'Неактивен',
    empty: 'Вы еще не добавили автомобиль.',
    brand: 'Марка',
    model: 'Модель',
    year: 'Год',
    color: 'Цвет',
    plate: 'Госномер',
    seats: 'Пассажирские места',
    required: 'Заполните все поля.',
    docs: 'Документы',
    docsInfo: 'Все документы должны быть подтверждены для создания поездок.',
    upload: 'Загрузить',
    uploading: 'Загрузка...',
    uploadError: 'Ошибка загрузки.',
    approved: 'Подтверждено',
    pending: 'На рассмотрении',
    rejected: 'Отклонено',
    missing: 'Не загружено',
  },
  en: {
    title: 'My vehicles',
    intro: 'Manage the vehicles you use when offering rides.',
    add: 'Add vehicle',
    edit: 'Edit',
    save: 'Save vehicle',
    cancel: 'Cancel',
    setDefault: 'Set as default',
    deactivate: 'Deactivate',
    defaultBadge: 'Default',
    activeBadge: 'Active',
    inactiveBadge: 'Inactive',
    empty: 'You have not added a vehicle yet.',
    brand: 'Brand',
    model: 'Model',
    year: 'Year',
    color: 'Color',
    plate: 'Plate number',
    seats: 'Passenger seats',
    required: 'Complete every field.',
    docs: 'Documents',
    docsInfo: 'All documents must be approved before you can create rides.',
    upload: 'Upload',
    uploading: 'Uploading...',
    uploadError: 'Upload failed.',
    approved: 'Approved',
    pending: 'Pending review',
    rejected: 'Rejected',
    missing: 'Not uploaded',
  },
} as const;

const EMPTY_FORM: VehicleInput = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  plateNumber: '',
  seatsCount: 4,
};

function VehicleBadge({ children, tone }: { children: React.ReactNode; tone: 'green' | 'amber' | 'gray' | 'red' | 'blue' }) {
  const classes = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray:  'bg-slate-100 text-slate-600 border-slate-200',
    red:   'bg-red-50 text-red-700 border-red-200',
    blue:  'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${classes[tone]}`}>
      {children}
    </span>
  );
}

function verificationTone(status: string): 'green' | 'amber' | 'gray' | 'red' | 'blue' {
  if (status === 'approved') return 'green';
  if (status === 'pending')  return 'amber';
  if (status === 'rejected') return 'red';
  return 'gray';
}

function docStatusTone(status: string): 'green' | 'amber' | 'gray' | 'red' {
  if (status === 'approved') return 'green';
  if (status === 'pending')  return 'amber';
  if (status === 'rejected') return 'red';
  return 'gray';
}

function DocumentRow({
  docType,
  doc,
  language,
  copy,
  onUpload,
  uploading,
}: {
  docType: VehicleDocumentType;
  doc?: VehicleDocument;
  language: string;
  copy: CopyShape;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const label = DOC_LABELS[docType][language] ?? DOC_LABELS[docType].en;

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text">{label}</p>
        {doc ? (
          <p className="mt-0.5 text-xs text-text-muted">
            {doc.rejectionReason ? `${doc.rejectionReason}` : STATUS_COPY[doc.status as keyof typeof STATUS_COPY]?.[language as 'en'] ?? doc.status}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-text-muted">{copy.missing}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {doc && (
          <VehicleBadge tone={docStatusTone(doc.status)}>
            {copy[doc.status as 'approved' | 'pending' | 'rejected'] ?? doc.status}
          </VehicleBadge>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Icon name="upload" size={14} />
          {uploading ? copy.uploading : copy.upload}
        </Button>
      </div>
    </div>
  );
}

type CopyShape = typeof COPY[keyof typeof COPY];

function VehicleDocumentsPanel({
  vehicle,
  language,
  copy,
}: {
  vehicle: Vehicle;
  language: string;
  copy: CopyShape;
}) {
  const queryClient = useQueryClient();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<VehicleDocumentType | null>(null);

  const verificationQuery = useQuery({
    queryKey: ['vehicle-verification', vehicle.id],
    queryFn: () => vehiclesService.getVerificationStatus(vehicle.id),
    enabled: vehicle.isActive,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ docType, file }: { docType: VehicleDocumentType; file: File }) =>
      vehiclesService.uploadDocument(vehicle.id, docType, file),
    onMutate: ({ docType }) => {
      setUploadingType(docType);
      setUploadError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-verification', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      setUploadingType(null);
    },
    onError: (err: Error) => {
      setUploadError(err.message || copy.uploadError);
      setUploadingType(null);
    },
  });

  const verif: VehicleVerificationStatus | undefined = verificationQuery.data;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-2 flex items-center gap-2">
        <p className="text-sm font-bold text-text">{copy.docs}</p>
        {verif && (
          <VehicleBadge tone={verificationTone(verif.verificationStatus)}>
            {STATUS_COPY[verif.verificationStatus as keyof typeof STATUS_COPY]?.[language as 'en'] ?? verif.verificationStatus}
          </VehicleBadge>
        )}
      </div>
      <p className="mb-3 text-xs text-text-muted">{copy.docsInfo}</p>

      {verificationQuery.isLoading ? (
        <p className="text-xs text-text-muted">...</p>
      ) : (
        <div className="divide-y divide-border">
          {DOC_TYPES.map((docType) => (
            <DocumentRow
              key={docType}
              docType={docType}
              doc={verif?.submitted[docType]}
              language={language}
              copy={copy}
              uploading={uploadingType === docType}
              onUpload={(file) => uploadMutation.mutate({ docType, file })}
            />
          ))}
        </div>
      )}

      {uploadError && (
        <p role="alert" className="mt-2 text-xs font-semibold text-danger-500">{uploadError}</p>
      )}
    </div>
  );
}

export default function DriverVehiclePage() {
  const { language } = useAppStore();
  const copy = COPY[language];
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleInput | null>(null);
  const [formError, setFormError] = useState('');
  const [expandedDocVehicleId, setExpandedDocVehicleId] = useState<string | null>(null);

  const vehiclesQuery = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => vehiclesService.getMyVehicles(),
  });

  const refreshVehicles = () => queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });

  const saveMutation = useMutation({
    mutationFn: (input: VehicleInput) => (
      editingId
        ? vehiclesService.updateVehicle(editingId, input)
        : vehiclesService.createVehicle(input)
    ),
    onSuccess: () => {
      refreshVehicles();
      setEditingId(null);
      setForm(null);
      setFormError('');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (vehicleId: string) => vehiclesService.setDefaultVehicle(vehicleId),
    onSuccess: refreshVehicles,
  });

  const deactivateMutation = useMutation({
    mutationFn: (vehicleId: string) => vehiclesService.deactivateVehicle(vehicleId),
    onSuccess: refreshVehicles,
  });

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
  };

  const startEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      plateNumber: vehicle.plateNumber,
      seatsCount: vehicle.seatsCount,
    });
    setFormError('');
  };

  const saveVehicle = () => {
    if (!form) return;
    if (!form.brand || !form.model || !form.color || !form.plateNumber.trim()) {
      setFormError(copy.required);
      return;
    }
    saveMutation.mutate({
      ...form,
      plateNumber: form.plateNumber.trim().toUpperCase(),
    });
  };

  const colorOptions = CAR_COLORS_LOCALIZED.map((color) => ({
    value: color.value,
    label: color.label[language] || color.label.en,
  }));
  const vehicles = vehiclesQuery.data ?? [];

  return (
    <DriverLayout narrow>
      <ProtectedRoute mode="driver">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-text">{copy.title}</h1>
              <p className="mt-1 text-sm text-text-muted">{copy.intro}</p>
            </div>
            {!form && (
              <Button onClick={startAdd}>
                <Icon name="plus" size={16} />
                {copy.add}
              </Button>
            )}
          </div>

          {form && (
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label={copy.brand}
                  value={form.brand}
                  onChange={(value) => setForm({ ...form, brand: String(value), model: '' })}
                  options={Object.keys(CAR_BRANDS_MODELS).sort()}
                  searchable
                />
                <Select
                  label={copy.model}
                  value={form.model}
                  onChange={(value) => setForm({ ...form, model: String(value) })}
                  options={form.brand ? CAR_BRANDS_MODELS[form.brand] || [] : []}
                  disabled={!form.brand}
                  searchable
                />
                <Select
                  label={copy.year}
                  value={form.year}
                  onChange={(value) => setForm({ ...form, year: Number(value) })}
                  options={CAR_YEARS}
                />
                <Select
                  label={copy.color}
                  value={form.color}
                  onChange={(value) => setForm({ ...form, color: String(value) })}
                  options={colorOptions}
                />
                <Input
                  label={copy.plate}
                  value={form.plateNumber}
                  onChange={(event) => setForm({ ...form, plateNumber: event.target.value })}
                  placeholder="99-XX-123"
                  maxLength={20}
                />
                <Select
                  label={copy.seats}
                  value={form.seatsCount}
                  onChange={(value) => setForm({ ...form, seatsCount: Number(value) })}
                  options={[1, 2, 3, 4]}
                />
              </div>
              {(formError || saveMutation.error) && (
                <p role="alert" className="mt-4 text-sm font-semibold text-danger-500">
                  {formError || saveMutation.error?.message}
                </p>
              )}
              <div className="mt-5 flex gap-3">
                <Button onClick={saveVehicle} loading={saveMutation.isPending}>
                  {copy.save}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm(null);
                    setFormError('');
                  }}
                >
                  {copy.cancel}
                </Button>
              </div>
            </Card>
          )}

          {vehiclesQuery.isLoading ? (
            <Card><p className="text-sm text-text-muted">...</p></Card>
          ) : vehiclesQuery.error ? (
            <Card>
              <p role="alert" className="text-sm text-danger-500">
                {vehiclesQuery.error.message}
              </p>
            </Card>
          ) : vehicles.length === 0 ? (
            <Card className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600">
                <Icon name="car" size={24} />
              </div>
              <p className="text-sm text-text-muted">{copy.empty}</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className={!vehicle.isActive ? 'bg-slate-50 opacity-75' : ''}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
                        <Icon name="car" size={22} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-text">
                            {vehicle.brand} {vehicle.model}
                          </h2>
                          {vehicle.isDefault && (
                            <VehicleBadge tone="amber">{copy.defaultBadge}</VehicleBadge>
                          )}
                          <VehicleBadge tone={vehicle.isActive ? 'green' : 'gray'}>
                            {vehicle.isActive ? copy.activeBadge : copy.inactiveBadge}
                          </VehicleBadge>
                          <VehicleBadge tone={verificationTone(vehicle.verificationStatus)}>
                            {STATUS_COPY[vehicle.verificationStatus]?.[language as 'en'] ?? vehicle.verificationStatus}
                          </VehicleBadge>
                        </div>
                        <p className="mt-1 text-sm text-text-muted">
                          {vehicle.year} · {getLocalizedColor(vehicle.color, language)} · {vehicle.plateNumber}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-text-secondary">
                          {vehicle.seatsCount} {copy.seats.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(vehicle)}>
                        <Icon name="settings" size={14} />
                        {copy.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedDocVehicleId(
                            expandedDocVehicleId === vehicle.id ? null : vehicle.id,
                          )
                        }
                      >
                        <Icon name="file-text" size={14} />
                        {copy.docs}
                      </Button>
                      {vehicle.isActive && !vehicle.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDefaultMutation.mutate(vehicle.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          <Icon name="star" size={14} />
                          {copy.setDefault}
                        </Button>
                      )}
                      {vehicle.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger-500"
                          onClick={() => deactivateMutation.mutate(vehicle.id)}
                          disabled={deactivateMutation.isPending}
                        >
                          <Icon name="ban" size={14} />
                          {copy.deactivate}
                        </Button>
                      )}
                    </div>
                  </div>

                  {expandedDocVehicleId === vehicle.id && (
                    <VehicleDocumentsPanel vehicle={vehicle} language={language} copy={copy} />
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </ProtectedRoute>
    </DriverLayout>
  );
}