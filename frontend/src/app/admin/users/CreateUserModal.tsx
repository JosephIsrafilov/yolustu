'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAppStore } from '@/store/useAppStore';
import { adminService } from '@/services';
import { ApiError } from '@/services/api-error';
import type { UserRole } from '@/types';

export const CREATE_USER_I18N = {
  az: {
    title: 'İstifadəçi yarat',
    firstName: 'Ad',
    lastName: 'Soyad',
    phone: 'Telefon',
    email: 'Email (istəyə bağlı)',
    password: 'Şifrə',
    role: 'Rol',
    city: 'Şəhər (istəyə bağlı)',
    passenger: 'Sərnişin',
    driver: 'Sürücü',
    admin: 'Admin',
    submit: 'Yarat',
    cancel: 'Ləğv et',
    required: 'Bu sahə tələb olunur',
    passwordShort: 'Şifrə ən azı 8 simvol olmalıdır',
    genericError: 'İstifadəçi yaradıla bilmədi. Yenidən cəhd edin.',
  },
  ru: {
    title: 'Создать пользователя',
    firstName: 'Имя',
    lastName: 'Фамилия',
    phone: 'Телефон',
    email: 'Email (необязательно)',
    password: 'Пароль',
    role: 'Роль',
    city: 'Город (необязательно)',
    passenger: 'Пассажир',
    driver: 'Водитель',
    admin: 'Админ',
    submit: 'Создать',
    cancel: 'Отмена',
    required: 'Это поле обязательно',
    passwordShort: 'Пароль должен быть не менее 8 символов',
    genericError: 'Не удалось создать пользователя. Попробуйте ещё раз.',
  },
  en: {
    title: 'Create user',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    email: 'Email (optional)',
    password: 'Password',
    role: 'Role',
    city: 'City (optional)',
    passenger: 'Passenger',
    driver: 'Driver',
    admin: 'Admin',
    submit: 'Create',
    cancel: 'Cancel',
    required: 'This field is required',
    passwordShort: 'Password must be at least 8 characters',
    genericError: 'Could not create user. Please try again.',
  },
} as const;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const language = useAppStore((state) => state.language);
  const copy = CREATE_USER_I18N[language];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('passenger');
  const [city, setCity] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const roleOptions = [
    { value: 'passenger', label: copy.passenger },
    { value: 'driver', label: copy.driver },
    { value: 'admin', label: copy.admin },
  ];

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = copy.required;
    if (!lastName.trim()) errors.lastName = copy.required;
    if (!phone.trim()) errors.phone = copy.required;
    if (!password) {
      errors.password = copy.required;
    } else if (password.length < 8) {
      errors.password = copy.passwordShort;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetAndClose = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setRole('passenger');
    setCity('');
    setFieldErrors({});
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await adminService.createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        role,
        city: city.trim() || undefined,
      });
      setIsSubmitting(false);
      resetAndClose();
      onSuccess();
    } catch (error) {
      setIsSubmitting(false);
      setSubmitError(error instanceof ApiError ? error.message : copy.genericError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-200">
        <Card className="relative w-full">
          {!isSubmitting && (
            <button
              onClick={resetAndClose}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors"
              aria-label={copy.cancel}
            >
              <Icon name="x" size={20} />
            </button>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text">{copy.title}</h2>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={copy.firstName}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={fieldErrors.firstName}
              />
              <Input
                placeholder={copy.lastName}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={fieldErrors.lastName}
              />
            </div>

            <Input
              placeholder={copy.phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={fieldErrors.phone}
              icon={<Icon name="phone" size={16} />}
            />

            <Input
              type="email"
              placeholder={copy.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Icon name="mail" size={16} />}
            />

            <Input
              type="password"
              placeholder={copy.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              icon={<Icon name="lock" size={16} />}
            />

            <Select
              value={role}
              onChange={(value) => setRole(value as UserRole)}
              options={roleOptions}
              label={copy.role}
            />

            <Input
              placeholder={copy.city}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              icon={<Icon name="map-pin" size={16} />}
            />

            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                <Icon name="alert-triangle" size={16} />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={resetAndClose} className="flex-1" disabled={isSubmitting}>
                {copy.cancel}
              </Button>
              <Button onClick={handleSubmit} loading={isSubmitting} className="flex-1">
                {copy.submit}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
