'use client';

import { useState } from 'react';
import { ApiError } from '@/infrastructure/api-client';
import * as authService from '@/services/auth';
import { Turnstile } from '@/components/turnstile';
import { mapErrorCode } from '@/lib/error-mapping';

interface RegisterFormProps {
  onSuccess?: (token: string | null) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!captchaToken) {
      setError('Captcha required');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await authService.register({
        email,
        password,
        captcha_token: captchaToken,
      });
      onSuccess?.(data.access_token ?? null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'AUTH-017') {
          setResetSignal((value) => value + 1);
          setCaptchaToken(null);
        }
        if (err.status === 429) {
          const retry = err.retryAfter ? ` Retry after ${err.retryAfter}s.` : '';
          setError(`${err.message}${retry}`);
        } else {
          setError(err.message || mapErrorCode(err.code));
        }
      } else {
        setError('An error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Turnstile
        onVerify={(token) => setCaptchaToken(token)}
        onExpire={() => setCaptchaToken(null)}
        resetSignal={resetSignal}
      />
      {error && <div role="alert">{error}</div>}
      <button type="submit" disabled={isSubmitting}>
        Register
      </button>
    </form>
  );
}

export default RegisterForm;
