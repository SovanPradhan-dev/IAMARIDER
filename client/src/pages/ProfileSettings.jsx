import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  avatarUrl: z.string().optional(),
});

export default function ProfileSettings() {
  const { user, updateProfile: upd } = useAuth();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user ? user.name : '',
      avatarUrl: user ? user.avatarUrl : '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, avatarUrl: user.avatarUrl });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setError('');
    setSaving(true);
    try {
      const res = await api.patch('/users/me', {
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
      });
      upd(res.data.user);
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (err) {
      const msg = err.response ? err.response.data.error || 'Failed to update profile' : 'Failed to update profile';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const nameInitial = user.name ? user.name.charAt(0) : '?';
  const memberSince = new Date(user.createdAt).toLocaleDateString();

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-8">
        <a href="/dashboard" className="text-sm text-forest-600 hover:underline mb-2 block">
          Back to dashboard
        </a>
        <h1 className="text-2xl font-bold text-slate-900">Profile settings</h1>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600">
            {nameInitial}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-600">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">Member since {memberSince}</p>
          </div>
          <button onClick={() => setIsEditing(true)} className="btn-outline text-sm">
            Edit profile
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Edit profile</h3>
          {error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          ) : null}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display name
              </label>
              <input
                {...register('name')}
                className={errors.name ? 'border-red-500 focus:ring-red-500 input' : 'input'}
              />
              {errors.name ? (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Avatar URL (optional)
              </label>
              <input
                {...register('avatarUrl')}
                type="url"
                className={errors.avatarUrl ? 'border-red-500 focus:ring-red-500 input' : 'input'}
                placeholder="https://example.com/avatar.png"
              />
              {errors.avatarUrl ? (
                <p className="mt-1 text-sm text-red-600">{errors.avatarUrl.message}</p>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
