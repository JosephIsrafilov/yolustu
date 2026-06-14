'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from "react";
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { adminService } from '@/services';
import type { User } from '@/types';

const VERIFICATIONS_I18N = {
  az: {
    title: 'Sürücü Təsdiqləmələri',
    refresh: 'Yenilə',
    confirmApprove: 'Bu istifadəçini təsdiqləmək istədiyinizə əminsiniz?',
    confirmReject: 'Bu istifadəçini rədd etmək istədiyinizə əminsiniz?',
    empty: 'Hal-hazırda gözləyən təsdiqləmə sorğusu yoxdur.',
    loadError: 'Təsdiqləmələri yükləmək alınmadı.',
    actionError: 'Əməliyyat alınmadı. Yenidən cəhd edin.',
    retry: 'Yenidən cəhd et',
    registered: 'Qeydiyyat:',
    viewDoc: 'Sənədə bax',
    noDoc: 'Sənəd yüklənməyib',
    reject: 'Rədd et',
    approve: 'Təsdiqlə',
    locale: 'az-AZ',
    aiTitle: 'AI ilkin yoxlama',
    aiRecApprove: 'Təsdiq tövsiyə olunur',
    aiRecReview: 'Əl ilə yoxlama lazımdır',
    aiRecReject: 'Rədd tövsiyə olunur',
    aiConfidence: 'Bu nəticəyə etibar',
    aiIsDocument: 'Sənəd tanındı',
    aiExtractedName: 'Sənəddəki ad',
    aiNameMatch: 'Ad uyğunluğu',
    aiAzerbaijani: 'Azərbaycan sənədi',
    aiExpiry: 'Bitmə tarixi',
    aiExpired: 'Vaxtı keçib',
    aiIssues: 'Qeydlər',
    aiPending: 'AI yoxlaması davam edir və ya mövcud deyil.',
    aiYes: 'Bəli',
    aiNo: 'Xeyr',
    aiDisclaimer: 'AI tövsiyəsi yalnız köməkçidir. Son qərarı admin verir.',
  },
  ru: {
    title: 'Подтверждение водителей',
    refresh: 'Обновить',
    confirmApprove: 'Вы уверены, что хотите подтвердить этого пользователя?',
    confirmReject: 'Вы уверены, что хотите отклонить этого пользователя?',
    empty: 'В настоящее время нет ожидающих запросов на подтверждение.',
    loadError: 'Не удалось загрузить заявки на подтверждение.',
    actionError: 'Операция не выполнена. Попробуйте ещё раз.',
    retry: 'Повторить',
    registered: 'Регистрация:',
    viewDoc: 'Посмотреть документ',
    noDoc: 'Документ не загружен',
    reject: 'Отклонить',
    approve: 'Подтвердить',
    locale: 'ru-RU',
    aiTitle: 'Предварительная AI-проверка',
    aiRecApprove: 'Рекомендуется одобрить',
    aiRecReview: 'Нужна ручная проверка',
    aiRecReject: 'Рекомендуется отклонить',
    aiConfidence: 'Уверенность в выводе',
    aiIsDocument: 'Документ распознан',
    aiExtractedName: 'Имя в документе',
    aiNameMatch: 'Совпадение имени',
    aiAzerbaijani: 'Документ Азербайджана',
    aiExpiry: 'Срок действия',
    aiExpired: 'Просрочен',
    aiIssues: 'Замечания',
    aiPending: 'AI-проверка выполняется или недоступна.',
    aiYes: 'Да',
    aiNo: 'Нет',
    aiDisclaimer: 'Рекомендация AI вспомогательная. Решение принимает админ.',
  },
  en: {
    title: 'Driver Verifications',
    refresh: 'Refresh',
    confirmApprove: 'Are you sure you want to approve this user?',
    confirmReject: 'Are you sure you want to reject this user?',
    empty: 'There are currently no pending verification requests.',
    loadError: 'Could not load verification requests.',
    actionError: 'Action failed. Please try again.',
    retry: 'Retry',
    registered: 'Registered:',
    viewDoc: 'View Document',
    noDoc: 'No document uploaded',
    reject: 'Reject',
    approve: 'Approve',
    locale: 'en-US',
    aiTitle: 'AI pre-screen',
    aiRecApprove: 'Approve recommended',
    aiRecReview: 'Manual review needed',
    aiRecReject: 'Reject recommended',
    aiConfidence: 'Verdict confidence',
    aiIsDocument: 'Document detected',
    aiExtractedName: 'Name on document',
    aiNameMatch: 'Name match',
    aiAzerbaijani: 'Azerbaijani document',
    aiExpiry: 'Expiry date',
    aiExpired: 'Expired',
    aiIssues: 'Flags',
    aiPending: 'AI review is in progress or unavailable.',
    aiYes: 'Yes',
    aiNo: 'No',
    aiDisclaimer: 'AI recommendation is advisory only. Admin makes the final call.',
  }
} as const;

type VerificationsCopy = (typeof VERIFICATIONS_I18N)[keyof typeof VERIFICATIONS_I18N];

const AI_REC_STYLES: Record<string, { box: string; dot: string }> = {
  approve: { box: 'border-green-200 bg-green-50 text-green-800', dot: 'bg-green-500' },
  needs_review: { box: 'border-amber-200 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  reject: { box: 'border-red-200 bg-red-50 text-red-800', dot: 'bg-red-500' },
};

function AiReviewPanel({ review, t }: { review: User['aiReview']; t: VerificationsCopy }) {
  if (!review) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-3 text-sm text-text-muted flex items-center gap-2">
        <Icon name="sparkles" size={16} className="shrink-0" />
        <span>{t.aiPending}</span>
      </div>
    );
  }

  const style = AI_REC_STYLES[review.recommendation] ?? AI_REC_STYLES.needs_review;
  const recLabel =
    review.recommendation === 'approve'
      ? t.aiRecApprove
      : review.recommendation === 'reject'
        ? t.aiRecReject
        : t.aiRecReview;
  const confidencePct = Math.round((review.confidence ?? 0) * 100);
  const yesNo = (v?: boolean | null) => (v === true ? t.aiYes : v === false ? t.aiNo : '—');

  return (
    <div className={`rounded-xl border px-4 py-3 ${style.box}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 font-semibold">
          <Icon name="sparkles" size={16} className="shrink-0" />
          <span>{t.aiTitle}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {recLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        <div><span className="opacity-70">{t.aiConfidence}:</span> <b>{confidencePct}%</b></div>
        {review.isDocument !== undefined && review.isDocument !== null && (
          <div><span className="opacity-70">{t.aiIsDocument}:</span> <b>{yesNo(review.isDocument)}</b></div>
        )}
        {review.extractedName && (
          <div className="truncate"><span className="opacity-70">{t.aiExtractedName}:</span> <b>{review.extractedName}</b></div>
        )}
        {review.nameMatchesProfile !== undefined && review.nameMatchesProfile !== null && (
          <div><span className="opacity-70">{t.aiNameMatch}:</span> <b>{yesNo(review.nameMatchesProfile)}</b></div>
        )}
        {review.isAzerbaijani !== undefined && review.isAzerbaijani !== null && (
          <div><span className="opacity-70">{t.aiAzerbaijani}:</span> <b>{yesNo(review.isAzerbaijani)}</b></div>
        )}
        {review.expiryDate && (
          <div><span className="opacity-70">{t.aiExpiry}:</span> <b>{review.expiryDate}</b></div>
        )}
        {review.isExpired !== undefined && review.isExpired !== null && (
          <div><span className="opacity-70">{t.aiExpired}:</span> <b>{yesNo(review.isExpired)}</b></div>
        )}
      </div>
      {review.issues.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs opacity-70">{t.aiIssues}:</span>
          {review.issues.map((issue) => (
            <span key={issue} className="rounded-md bg-white/70 px-2 py-0.5 text-xs font-medium">{issue}</span>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] italic opacity-70">{t.aiDisclaimer}</p>
    </div>
  );
}

export default function AdminVerificationsPage() {
  const language = useAppStore((s) => s.language);
  const t = VERIFICATIONS_I18N[language];
  
  const [verifications, setVerifications] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const limit = 10;

  const fetchVerifications = useCallback(async (currentPage: number) => {
    setLoadError(false);
    try {
      const res = await adminService.getPendingVerifications(currentPage, limit);
      setVerifications(res.items);
      setTotalPages(res.pages);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const retryFetch = () => {
    setIsLoading(true);
    void fetchVerifications(page);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchVerifications(page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchVerifications, page]);

  const handlePageChange = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  const handleApprove = async (userId: string) => {
    if (confirm(t.confirmApprove)) {
      setActionError(null);
      setPendingUserId(userId);
      try {
        await adminService.approveVerification(userId);
        setVerifications(prev => prev.filter(v => v.id !== userId));
      } catch {
        setActionError(t.actionError);
      } finally {
        setPendingUserId(null);
      }
    }
  };

  const handleReject = async (userId: string) => {
    if (confirm(t.confirmReject)) {
      setActionError(null);
      setPendingUserId(userId);
      try {
        await adminService.rejectVerification(userId);
        setVerifications(prev => prev.filter(v => v.id !== userId));
      } catch {
        setActionError(t.actionError);
      } finally {
        setPendingUserId(null);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text mb-4 sm:mb-0">{t.title}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLoading(true);
            void fetchVerifications(page);
          }}
        >
          <Icon name="refresh-cw" size={16} className="mr-2" /> {t.refresh}
        </Button>
      </div>

      <div className="flex flex-col flex-1">
        {actionError && (
          <div className="mb-4">
            <ErrorBanner message={actionError} />
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingState />
          </div>
        ) : loadError ? (
          <ErrorBanner message={t.loadError} onRetry={retryFetch} retryLabel={t.retry} />
        ) : verifications.length === 0 ? (
          <Card className="py-16 text-center shadow-sm border-border bg-white rounded-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-muted">
              <Icon name="shield-check" size={32} />
            </div>
            <p className="text-text-secondary text-lg">{t.empty}</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 mb-6">
              {verifications.map((user) => (
                <Card key={user.id} className="animate-fade-in shadow-sm border border-border hover:shadow-md transition-all duration-200" padding="lg">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="h-16 w-16 rounded-full border border-border overflow-hidden shrink-0 flex items-center justify-center bg-surface">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.fullName}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-600">
                            <Icon name="user" size={28} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-text mb-1">{user.fullName}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                          <span className="flex items-center gap-1.5 font-medium"><Icon name="phone" size={14} />{user.phone}</span>
                          <span className="hidden sm:inline text-border">•</span>
                          <span className="flex items-center gap-1.5"><Icon name="calendar" size={14} />{t.registered} {new Date(user.createdAt).toLocaleDateString(t.locale)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 py-4 lg:py-0 border-y lg:border-0 border-border border-dashed lg:border-solid">
                      {user.documentUrl ? (
                        <button 
                          onClick={(e) => {
                            if (user.documentUrl === '#') {
                              e.preventDefault();
                              alert('Document preview is not available for mock data.');
                            } else {
                              window.open(user.documentUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                        >
                          <Icon name="file-text" size={18} /> {t.viewDoc}
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 px-5 py-3 bg-danger-50 text-danger-700 rounded-xl text-sm font-semibold">
                          <Icon name="alert-triangle" size={18} />
                          <span>{t.noDoc}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="danger" className="flex-1 lg:flex-none" disabled={pendingUserId === user.id} onClick={() => handleReject(user.id)}>
                        <Icon name="x" size={18} className="mr-1.5" /> {t.reject}
                      </Button>
                      <Button variant="primary" className="flex-1 lg:flex-none" disabled={pendingUserId === user.id} onClick={() => handleApprove(user.id)}>
                        <Icon name="check" size={18} className="mr-1.5" /> {t.approve}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border border-dashed">
                    <AiReviewPanel review={user.aiReview} t={t} />
                  </div>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
