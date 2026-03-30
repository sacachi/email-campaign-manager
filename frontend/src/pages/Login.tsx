import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/campaigns');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(form);
  };

  return (
    <div className="flex align-items-center justify-content-center min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card className="w-full" style={{ maxWidth: '420px', borderRadius: '12px' }}>
        <div className="text-center mb-5">
          <i className="pi pi-megaphone mb-3" style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }} />
          <h2 className="text-2xl font-bold text-900 m-0">Campaign Manager</h2>
          <p className="text-500 mt-2 mb-0">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-fluid">
          {error && (
            <Message severity="error" text={error} className="w-full mb-4" />
          )}

          <div className="flex flex-column gap-2 mb-4">
            <label htmlFor="email" className="font-medium text-900">Email</label>
            <InputText
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="flex flex-column gap-2 mb-4">
            <label htmlFor="password" className="font-medium text-900">Password</label>
            <Password
              id="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              inputClassName="w-full"
              toggleMask
              feedback={false}
              required
            />
          </div>

          <Button
            type="submit"
            label={loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            icon={loginMutation.isPending ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
            loading={loginMutation.isPending}
            className="w-full mt-2"
          />

          <div className="mt-4 pt-3 border-top-1 surface-border">
            <p className="text-center text-500 text-sm mb-3">Quick demo access</p>
            <div className="flex gap-2">
              <Button
                type="button"
                label="Demo User"
                icon="pi pi-user"
                className="p-button-outlined p-button-secondary w-full"
                onClick={() => {
                  setForm({ email: 'demo@example.com', password: 'password123' });
                }}
              />
              <Button
                type="button"
                label="Login Demo"
                icon="pi pi-rocket"
                className="w-full"
                onClick={() => {
                  setForm({ email: 'demo@example.com', password: 'password123' });
                  setTimeout(() => loginMutation.mutate({ email: 'demo@example.com', password: 'password123' }), 100);
                }}
                disabled={loginMutation.isPending}
              />
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
