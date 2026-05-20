'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';

export default function AdminVerificationsPage() {
  const { pendingVerifications, fetchPendingVerifications, approveVerification, rejectVerification } = useAppStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchPendingVerifications().finally(() => setLoading(false));
  }, [fetchPendingVerifications]);

  const handleApprove = async (userId: string) => {
    if (confirm('Bu istifadəçini təsdiqləmək istədiyinizə əminsiniz?')) {
      await approveVerification(userId);
    }
  };

  const handleReject = async (userId: string) => {
    if (confirm('Bu istifadəçini rədd etmək istədiyinizə əminsiniz?')) {
      await rejectVerification(userId);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Sürücü Təsdiqləmələri</h1>
        <Button variant="outline" size="sm" onClick={() => fetchPendingVerifications()}>
          <Icon name="refresh-cw" size={16} className="mr-2" /> Yenilə
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
        </div>
      ) : pendingVerifications.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-muted">
            <Icon name="shield-check" size={24} />
          </div>
          <p className="text-text-secondary">Hal-hazırda gözləyən təsdiqləmə sorğusu yoxdur.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingVerifications.map((user) => (
            <Card key={user.id} className="animate-fade-in">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      <Icon name="user" size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-text">{user.fullName}</h3>
                    <p className="text-sm text-text-muted">{user.phone}</p>
                    <p className="text-xs text-text-muted">Qeydiyyat: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-center px-4">
                  {user.documentUrl ? (
                    <a 
                      href={user.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Icon name="file-text" size={16} /> Sənədə bax
                    </a>
                  ) : (
                    <span className="text-xs text-danger-500 italic">Sənəd yüklənməyib</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="danger" size="sm" onClick={() => handleReject(user.id)}>
                    Rədd et
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleApprove(user.id)}>
                    Təsdiqlə
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
