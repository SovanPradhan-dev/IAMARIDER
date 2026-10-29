import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/common/Toast.jsx';
import { api } from '../lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  avatarUrl: z.string().optional(),
  notificationPreferences: z.object({
    tripUpdates: z.boolean(),
    checkpointArrivals: z.boolean(),
    safetyAlerts: z.boolean(),
  }),
  emergencyName: z.string().max(100).optional(),
  emergencyPhone: z.string().max(30).optional(),
  emergencyRelationship: z.string().max(50).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Use at least 8 characters').max(128),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

export default function ProfileSettings() {
  const { user, updateProfile: upd } = useAuth();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

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
      emergencyName: user?.emergencyContact?.name || '',
      emergencyPhone: user?.emergencyContact?.phone || '',
      emergencyRelationship: user?.emergencyContact?.relationship || '',
      notificationPreferences: {
        tripUpdates: user?.notificationPreferences?.tripUpdates ?? true,
        checkpointArrivals: user?.notificationPreferences?.checkpointArrivals ?? true,
        safetyAlerts: user?.notificationPreferences?.safetyAlerts ?? true,
      },
    },
  });
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        avatarUrl: user.avatarUrl || '',
        emergencyName: user.emergencyContact?.name || '',
        emergencyPhone: user.emergencyContact?.phone || '',
        emergencyRelationship: user.emergencyContact?.relationship || '',
        notificationPreferences: {
          tripUpdates: user.notificationPreferences?.tripUpdates ?? true,
          checkpointArrivals: user.notificationPreferences?.checkpointArrivals ?? true,
          safetyAlerts: user.notificationPreferences?.safetyAlerts ?? true,
        },
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setError('');
    setSaving(true);
    try {
      await upd({
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
        notificationPreferences: data.notificationPreferences,
        emergencyContact: data.emergencyName || data.emergencyPhone || data.emergencyRelationship
          ? {
            name: data.emergencyName || 'Emergency contact',
            phone: data.emergencyPhone || '',
            relationship: data.emergencyRelationship || '',
          }
          : null,
      });
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

  const onPasswordSubmit = async ({ currentPassword, newPassword }) => {
    setPasswordError('');
    setPasswordSaving(true);
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      resetPassword();
      toast.success('Password updated. Your other sessions have been signed out.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update password';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setPasswordSaving(false);
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
            <fieldset className="space-y-3 border-t border-slate-200 pt-4">
              <legend className="text-sm font-semibold text-slate-700">Emergency contact (private)</legend>
              <div>
                <label htmlFor="emergencyName" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input id="emergencyName" {...register('emergencyName')} className="input" />
              </div>
              <div>
                <label htmlFor="emergencyPhone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input id="emergencyPhone" {...register('emergencyPhone')} type="tel" className="input" />
              </div>
              <div>
                <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                <input id="emergencyRelationship" {...register('emergencyRelationship')} className="input" />
              </div>
            </fieldset>
            <fieldset className="space-y-3 border-t border-slate-200 pt-4">
              <legend className="text-sm font-semibold text-slate-700">In-app notifications</legend>
              {[
                ['notificationPreferences.tripUpdates', 'Trip membership and lifecycle updates'],
                ['notificationPreferences.checkpointArrivals', 'Checkpoint arrival updates'],
                ['notificationPreferences.safetyAlerts', 'Safety and emergency alerts'],
              ].map(([field, label]) => (
                <label key={field} className="flex items-start gap-3 text-sm text-slate-600">
                  <input type="checkbox" {...register(field)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-forest-700 focus:ring-forest-500" />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
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

      <section className="card mt-5">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-forest-700">Account security</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Change your password</h2>
          <p className="mt-1 text-sm text-slate-500">Changing your password signs out other active sessions.</p>
        </div>
        {passwordError && (
          <div role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{passwordError}</div>
        )}
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-slate-700">Current password</label>
            <input id="currentPassword" type="password" autoComplete="current-password" {...registerPassword('currentPassword')} className="input" />
            {passwordErrors.currentPassword && <p className="mt-1 text-xs text-rose-600">{passwordErrors.currentPassword.message}</p>}
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
            <input id="newPassword" type="password" autoComplete="new-password" {...registerPassword('newPassword')} className="input" />
            {passwordErrors.newPassword && <p className="mt-1 text-xs text-rose-600">{passwordErrors.newPassword.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" {...registerPassword('confirmPassword')} className="input" />
            {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{passwordErrors.confirmPassword.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={passwordSaving} className="btn-primary">
              {passwordSaving ? 'Updating password…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
