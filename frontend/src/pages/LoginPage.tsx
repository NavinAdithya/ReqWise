import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, error, loading } = useStore();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password);
      // Wait for auth to populate, then redirect based on role
      const role = useStore.getState().user?.role;
      if (role === 'ADMIN') {
        navigate('/dashboard');
      } else if (role === 'QA') {
        navigate('/dashboard');
      } else if (role === 'CLIENT') {
        navigate('/dashboard');
      }
    } catch (_) {
      // Handled by Zustand state
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 font-sans">
      <div className="w-full max-w-sm border border-slate-200 bg-white p-8 rounded shadow-sm scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">REQWISE</h2>
          <p className="text-xs text-slate-400 mt-1">Human-First Requirement Validation</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-2.5 rounded text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              placeholder="e.g. name@domain.com"
            />
            {errors.email && (
              <p className="text-[10px] text-red-500 mt-1 font-medium">{String(errors.email.message)}</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-[10px] text-red-500 mt-1 font-medium">{String(errors.password.message)}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded py-2.5 text-xs font-semibold tracking-wider transition-all duration-150"
          >
            {loading ? 'Authenticating...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Demo Credentials</p>
          <div className="flex flex-col gap-1.5 text-xs text-slate-600 text-left">
            <div className="flex justify-between px-2 py-1 bg-slate-50 rounded">
              <span className="font-medium text-slate-500">Admin</span>
              <span className="font-mono text-brand-600 text-[11px]">admin1@reqwise.com</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-slate-50 rounded">
              <span className="font-medium text-slate-500">QA Lead</span>
              <span className="font-mono text-brand-600 text-[11px]">qa1@reqwise.com</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-slate-50 rounded">
              <span className="font-medium text-slate-500">Client</span>
              <span className="font-mono text-brand-600 text-[11px]">client1@reqwise.com</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center italic">Password for all: <span className="font-mono font-medium">password123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
