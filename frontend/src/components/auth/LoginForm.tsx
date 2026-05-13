'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import { signIn } from '@/services/auth.service';
import { ROLE_ROUTES } from '@/types/auth.types';

function EmailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!values.email) {
    errors.email = 'E-mail é obrigatório';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Formato de e-mail inválido';
  }
  if (!values.password) {
    errors.password = 'Senha é obrigatória';
  } else if (values.password.length < 6) {
    errors.password = 'Senha deve ter no mínimo 6 caracteres';
  }
  return errors;
}

export default function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
      if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const user = await signIn(values);
      router.push(ROLE_ROUTES[user.role]);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card p-8 sm:p-10 animate-bounce-in">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 animate-slide-up">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kodar-600 shadow-md shadow-kodar-600/25">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <span className="text-xl font-bold text-slate-900">Kodar</span>
      </div>

      {/* Title */}
      <div className="mb-8 animate-slide-up-d1">
        <h1 className="text-3xl font-extrabold text-gradient-kodar">Entrar</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Acesse sua conta para continuar aprendendo
        </p>
      </div>

      {/* Error banner */}
      {errors.general && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 animate-fade-in">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-red-700">{errors.general}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="animate-slide-up-d2">
          <InputField
            id="email"
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={values.email}
            onChange={handleChange('email')}
            error={errors.email}
            icon={<EmailIcon />}
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1.5 animate-slide-up-d3">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Senha
            </label>
            <button
              type="button"
              className="text-xs font-medium text-kodar-600 hover:text-kodar-700 transition-colors hover:underline underline-offset-2"
              tabIndex={-1}
            >
              Esqueceu a senha?
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <LockIcon />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={values.password}
              onChange={handleChange('password')}
              autoComplete="current-password"
              disabled={loading}
              className={[
                'w-full rounded-xl border bg-white pl-10 pr-10 py-3 text-sm text-slate-900',
                'placeholder:text-slate-400 outline-none transition-all duration-200',
                'focus:ring-2 focus:ring-kodar-500 focus:border-kodar-500',
                errors.password
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                  : 'border-slate-200 hover:border-slate-300',
              ].join(' ')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password}
            </p>
          )}
        </div>

        <div className="animate-slide-up-d4">
          <Button type="submit" loading={loading} className="group mt-2 w-full py-3.5 text-base">
            {!loading && (
              <>
                Entrar
                <ArrowRightIcon />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="my-6 animate-slide-up-d5">
        <div className="login-divider">ou</div>
      </div>

      {/* Google login (visual only) */}
      <div className="animate-slide-up-d5">
        <button type="button" className="google-btn" disabled aria-label="Login com Google — em breve">
          <GoogleIcon />
          Continuar com Google
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center animate-fade-in">
        <p className="text-xs text-slate-400">
          Ao entrar, você concorda com os{' '}
          <span className="font-medium text-kodar-600 hover:underline cursor-pointer">Termos de Uso</span>{' '}
          e a{' '}
          <span className="font-medium text-kodar-600 hover:underline cursor-pointer">Política de Privacidade</span>
        </p>
        <p className="mt-3 text-[11px] text-slate-300">
          © {new Date().getFullYear()} Kodar · v1.0.0
        </p>
      </div>
    </div>
  );
}
