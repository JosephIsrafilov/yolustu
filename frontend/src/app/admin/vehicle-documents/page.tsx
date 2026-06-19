'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { adminService } from '@/services';
import { useAppStore } from '@/store/useAppStore';
import type { VehicleDocument } from '@/types';

const DOC_TYPE_LABELS: Record<string, Record<string, string>> = {
  registration: { az: 'Qeydiyyat şəhadətnaməsi', ru: 'Свидетельство о регистрации', en: 'Registration certificate' },
  insurance:    { az: 'Sığorta polisi',            ru: 'Страховой полис',              en: 'Insurance policy' },
  inspection:   { az: 'Texniki baxış',             ru: 'Технический осмотр',           en: 'Technical inspection' },
};

const I18N = {
  az: {
    title: 'Nəqliyyat vasitəsi sənədləri',
    refresh: 'Yenilə',
    empty: 'Gözləyən sənəd yoxdur.',
    loadError: 'Sənədlər yüklənə bilmədi.',
    actionError: 'Əməliyyat uğursuz oldu.',
    retry: 'Yenidən cəhd et',
    viewDoc: 'Sənədə bax',
    approve: 'Təsdiqlə',
    reject: 'Rədd et',
    rejectionReason: 'Rədd səbəbi (istəyə görə)',
    submit: 'Göndər',
    cancel: 'Ləğv et',
    confirmApprove: 'Bu sənədi təsdiqləmək istədiyinizə əminsiniz?',
    aiTitle: 'AI tövsiyəsi',
    aiPending: 'AI yoxlaması davam edir.',
    aiDisclaimer: 'AI tövsiyəsi yalnız köməkçidir.',
    version: 'Versiya',
    uploaded: 'Yüklənib',
    docType: 'Növ',
    vehicleId: 'Avtomobil',
    conflictError: 'Bu sənədə başqa admin baxdı. Səhifəni yeniləyin.',
  },
  ru: {
    title: 'Документы транспортных средств',
    refresh: 'Обновить',
    empty: 'Нет ожидающих документов.',
    loadError: 'Не удалось загрузить документы.',
    actionError: 'Операция не удалась.',
    retry: 'Повторить',
    viewDoc: 'Открыть документ',
    approve: 'Подтвердить',
    reject: 'Отклонить',
    rejectionReason: 'Причина отклонения (необязательно)',
    submit: 'Отправить',
    cancel: 'Отмена',
    confirmApprove: 'Вы уверены, что хотите подтвердить этот документ?',
    aiTitle: 'AI-рекомендация',
    aiPending: 'AI-проверка выполняется.',
    aiDisclaimer: 'Рекомендация AI вспомогательная.',
    version: 'Версия',
    uploaded: 'Загружен',
    docType: 'Тип',
    vehicleId: 'Автомобиль',
    conflictError: 'Другой админ уже обработал этот документ. Обновите страницу.',
  },
  en: {
    title: 'Vehicle Documents',
    refresh: 'Refresh',
    empty: 'No pending documents.',
    loadError: 'Could not load documents.',
    actionError: 'Action failed.',
    retry: 'Retry',
    viewDoc: 'View document',
    approve: 'Approve',
    reject: 'Reject',
    rejectionReason: 'Rejection reason (optional)',
    submit: 'Submit',
    cancel: 'Cancel',
    confirmApprove: 'Approve this document?',
    aiTitle: 'AI recommendation',
    aiPending: 'AI review in progress.',
    aiDisclaimer: 'AI recommendation is advisory only. Admin makes the final call.',
    version: 'Version',
    uploaded: 'Uploaded',
    docType: 'Type',
    vehicleId: 'Vehicle',
    conflictError: 'Another admin already acted on this document. Refresh and try again.',
  },
} as const;

const AI_REC_STYLES: Record<string, { box: string; dot: string; label: Record<string, string> }> = {
  approve:      { box: 'border-green-200 bg-green-50 text-green-800',  dot: 'bg-green-500',  label: { az: 'Təsdiq tövsiyə',    ru: 'Рекомендуется',    en: 'Approve recommended' } },
  needs_review: { box: 'border-amber-200 bg-amber-50 text-amber-800',  dot: 'bg-amber-500',  label: { az: 'Əl ilə yoxlama',    ru: 'Ручная проверка',  en: 'Manual review needed' } },
  reject:       { box: 'border-red-200 bg-red-50 text-red-800',        dot: 'bg-red-500',    label: { az: 'Rədd tövsiyə',       ru: 'Отклонить',        en: 'Reject recommended' } },
};

function AiPanel({ doc, language }: { doc: VehicleDocument; language: string }) {
  const t = I18N[language as keyof typeof I18N] ?? I18N.en;
  if (!doc.aiRecommendation) {
    return (
      <p className="text-xs text-text-muted italic">
        <Icon name="sparkles" size={13} className="mr-1 inline" />
        {t.aiPending}
      </p>
    );
  }
  const style = AI_REC_STYLES[doc.aiRecommendation] ?? AI_REC_STYLES.needs_review;
  const label = style.label[language] ?? style.label.en;
  return (
    <div className={`mt-2 rounded-xl border px-3 py-2 text-xs ${style.box}`}>
      <div className="flex items-center justify-between gap-2 font-semibold">
        <span className="flex items-center gap-1.5">
          <Icon name="sparkles" size={13} />
          {t.aiTitle}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 font-bold">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {label}
        </span>
      </div>
      {doc.aiConfidence !== null && doc.aiConfidence !== undefined && (
        <p className="mt-1 opacity-80">{Math.round(doc.aiConfidence * 100)}% confidence</p>
      )}
      {doc.aiIssues && doc.aiIssues.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {doc.aiIssues.map((issue) => (
            <span key={issue} className="rounded bg-white/70 px-1.5 py-0.5 font-medium">{issue}</span>
          ))}
        </div>
      )}
      <p className="mt-1 italic opacity-60">{t.aiDisclaimer}</p>
    </div>
  );
}

function RejectModal({
  onSubmit,
  onCancel,
  language,
  isPending,
}: {
  onSubmit: (reason: string) => void;
  onCancel: () => void;
  language: string;
  isPending: boolean;
}) {
  const t = I18N[language as keyof typeof I18N] ?? I18N.en;
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-3 font-bold text-text">{t.reject}</h3>
        <textarea
          className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-text outline-none focus:ring-2 focus:ring-brand-300"
          rows={3}
          placeholder={t.rejectionReason}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>{t.cancel}</Button>
          <Button variant="danger" onClick={() => onSubmit(reason)} loading={isPending}>{t.submit}</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVehicleDocumentsPage() {
  const language = useAppStore((s) => s.language);
  const t = I18N[language] ?? I18N.en;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<VehicleDocument | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-vehicle-documents', page],
    queryFn: () => adminService.getPendingVehicleDocuments(page, 10),
  });

  const decideMutation = useMutation({
    mutationFn: ({
      docId,
      decision,
      reason,
      version,
    }: {
      docId: string;
      decision: 'approved' | 'rejected';
      reason: string | null;
      version: number;
    }) => adminService.decideVehicleDocument(docId, decision, reason, version),
    onSuccess: () => {
      setRejectTarget(null);
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-vehicle-documents'] });
    },
    onError: (err: Error & { status?: number }) => {
      setRejectTarget(null);
      setActionError(err.status === 409 ? t.conflictError : t.actionError);
    },
  });

  const handleApprove = (doc: VehicleDocument) => {
    if (!confirm(t.confirmApprove)) return;
    setActionError(null);
    decideMutation.mutate({ docId: doc.id, decision: 'approved', reason: null, version: doc.version });
  };

  const handleRejectSubmit = (reason: string) => {
    if (!rejectTarget) return;
    decideMutation.mutate({
      docId: rejectTarget.id,
      decision: 'rejected',
      reason: reason || null,
      version: rejectTarget.version,
    });
  };

  const docs = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <Icon name="refresh-cw" size={16} className="mr-1" />
          {t.refresh}
        </Button>
      </div>

      {actionError && (
        <div className="mb-4">
          <ErrorBanner message={actionError} />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingState /></div>
      ) : isError ? (
        <ErrorBanner message={t.loadError} onRetry={() => refetch()} retryLabel={t.retry} />
      ) : docs.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-muted">
            <Icon name="file-text" size={32} />
          </div>
          <p className="text-text-secondary">{t.empty}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {docs.map((doc) => {
              const typeLabel = DOC_TYPE_LABELS[doc.documentType]?.[language] ?? doc.documentType;
              const contentUrl = adminService.getVehicleDocumentContentUrl(doc.id);
              return (
                <Card key={doc.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-text">{typeLabel}</span>
                        <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
                          {t.version} {doc.version}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-text-muted font-mono">
                        {t.vehicleId}: {doc.vehicleId}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {t.uploaded}: {new Date(doc.createdAt).toLocaleString()}
                      </p>
                      <AiPanel doc={doc} language={language} />
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                      <a
                        href={contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-muted px-4 py-2 text-sm font-semibold text-text hover:bg-surface transition-colors"
                      >
                        <Icon name="external-link" size={14} />
                        {t.viewDoc}
                      </a>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(doc)}
                        disabled={decideMutation.isPending}
                      >
                        <Icon name="check" size={14} />
                        {t.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => { setRejectTarget(doc); setActionError(null); }}
                        disabled={decideMutation.isPending}
                      >
                        <Icon name="x" size={14} />
                        {t.reject}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 rounded-xl border border-border bg-white overflow-hidden">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </>
      )}

      {rejectTarget && (
        <RejectModal
          language={language}
          isPending={decideMutation.isPending}
          onSubmit={handleRejectSubmit}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
