'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/stores/auth';
import { ApiError } from '@/infrastructure/api-client';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login, register, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === 'login';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.push('/funding-arbitrage');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CONFLICT') {
          setError(t('emailExists'));
        } else if (err.code === 'VALIDATION_ERROR') {
          setError(t('validationError'));
        } else if (err.status === 401) {
          setError(t('invalidCredentials'));
        } else {
          setError(err.message);
        }
      } else {
        setError(t('unknownError'));
      }
    }
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{isLogin ? t('loginTitle') : t('registerTitle')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isLogin ? t('loginSubtitle') : t('registerSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('passwordPlaceholder')}
            required
            minLength={8}
          />
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              required
              minLength={8}
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('loading') : isLogin ? t('loginButton') : t('registerButton')}
        </Button>
      </form>

      <div className="text-center text-sm">
        {isLogin ? (
          <p>
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary underline">
              {t('registerLink')}
            </Link>
          </p>
        ) : (
          <p>
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-primary underline">
              {t('loginLink')}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
