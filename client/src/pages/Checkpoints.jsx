import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, Clock3, Flag, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

const emptyForm = (sequence = 1) => ({
  name: '',
  description: '',
  latitude: '',
  longitude: '',
  sequence: String(sequence),
  plannedArrivalAt: '',
});

const asLocalDateTime = (date) => {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.valueOf())) return '';
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export default function Checkpoints() {
  const { tripId } = useParams();
  const [checkpoints, setCheckpoints] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      const [tripResponse, checkpointResponse] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/checkpoints`),
      ]);
      const list = checkpointResponse.data.checkpoints || [];
      setTrip(tripResponse.data.trip);
      setCheckpoints(list);
      setIsLeader(tripResponse.data.membership?.role === 'leader');
      if (!editingId) setForm((current) => current.name ? current : emptyForm(list.length + 1));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load checkpoints');
    } finally {
      setLoading(false);
    }
  }, [tripId, editingId]);

  useEffect(() => { load(); }, [load]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submitCheckpoint = async (event) => {
    event.preventDefault();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const sequence = Number(form.sequence);
    if (!form.name.trim() || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !Number.isInteger(sequence) || sequence < 1) {
      toast.error('Enter a name, valid coordinates, and a positive stop number');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        latitude,
        longitude,
        sequence,
        plannedArrivalAt: form.plannedArrivalAt ? new Date(form.plannedArrivalAt).toISOString() : undefined,
      };
      if (editingId) await api.patch(`/trips/${tripId}/checkpoints/${editingId}`, payload);
      else await api.post(`/trips/${tripId}/checkpoints`, payload);
      toast.success(editingId ? 'Checkpoint updated' : 'Checkpoint added');
      setEditingId(null);
      setForm(emptyForm(checkpoints.length + (editingId ? 1 : 2)));
      const { data } = await api.get(`/trips/${tripId}/checkpoints`);
      setCheckpoints(data.checkpoints || []);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'add'} checkpoint`);
    } finally {
      setSaving(false);
    }
  };

  const editCheckpoint = (checkpoint) => {
    setEditingId(checkpoint._id);
    setForm({
      name: checkpoint.name || '',
      description: checkpoint.description || '',
      latitude: String(checkpoint.location?.coordinates?.[1] ?? ''),
      longitude: String(checkpoint.location?.coordinates?.[0] ?? ''),
      sequence: String(checkpoint.sequence || 1),
      plannedArrivalAt: asLocalDateTime(checkpoint.plannedArrivalAt),
    });
  };

  const deleteCheckpoint = async (checkpointId) => {
    if (!window.confirm('Delete this checkpoint and its arrival records?')) return;
    try {
      await api.delete(`/trips/${tripId}/checkpoints/${checkpointId}`);
      setCheckpoints((current) => current.filter((checkpoint) => checkpoint._id !== checkpointId));
      toast.success('Checkpoint deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete checkpoint');
    }
  };

  const reportArrival = async (checkpointId) => {
    try {
      await api.post(`/trips/${tripId}/checkpoints/${checkpointId}/arrivals`);
      toast.success('Your arrival has been recorded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report arrival');
    }
  };

  if (loading) return <div className="mx-auto max-w-5xl animate-pulse space-y-4"><div className="h-36 rounded-3xl bg-white ring-1 ring-slate-200" /><div className="grid gap-3 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-40 rounded-2xl bg-white ring-1 ring-slate-200" />)}</div></div>;

  return (
    <div className="mx-auto max-w-5xl">
      <section className="mb-5 flex flex-col gap-5 rounded-[26px] bg-forest-950 p-6 text-white shadow-xl shadow-forest-950/10 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-emerald-300"><Flag size={14} /> Stops along the way</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Make every stop count.</h2>
          <p className="mt-2 text-sm text-emerald-100/70">{trip?.name} · {checkpoints.length} {checkpoints.length === 1 ? 'checkpoint' : 'checkpoints'}</p>
        </div>
        <Link to={`/trips/${tripId}/live`} className="inline-flex items-center gap-2 text-xs font-bold text-white/80 transition hover:text-white">View live map <ArrowRight size={14} /></Link>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <section>
          {checkpoints.length ? (
            <div className="space-y-3">
              {checkpoints.map((checkpoint) => {
                const coordinates = checkpoint.location?.coordinates || [];
                return (
                  <article key={checkpoint._id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest-50 font-mono text-sm font-extrabold text-forest-800">{String(checkpoint.sequence).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">{checkpoint.name}</h3>
                          {checkpoint.plannedArrivalAt && <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[9px] font-bold text-sky-800"><Clock3 size={11} />{new Date(checkpoint.plannedArrivalAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                        {checkpoint.description && <p className="mt-1 text-xs leading-5 text-slate-500">{checkpoint.description}</p>}
                        <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400"><MapPin size={12} />{coordinates.length === 2 ? `${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}` : 'Location unavailable'}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <button onClick={() => reportArrival(checkpoint._id)} className="inline-flex items-center gap-1.5 rounded-lg bg-forest-50 px-3 py-2 text-[10px] font-bold text-forest-800 transition hover:bg-forest-100"><Check size={13} /> I arrived</button>
                      {isLeader && <div className="flex gap-2">
                        <button onClick={() => editCheckpoint(checkpoint)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Pencil size={12} /> Edit</button>
                        <button onClick={() => deleteCheckpoint(checkpoint._id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"><Trash2 size={12} /> Remove</button>
                      </div>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-forest-50 text-forest-700"><MapPin size={22} /></span>
              <h3 className="mt-4 font-extrabold text-slate-900">No stops plotted yet.</h3>
              <p className="mt-2 text-sm text-slate-500">{isLeader ? 'Add a checkpoint to give the crew a place to regroup.' : 'The trip leader can add stops along your route.'}</p>
            </div>
          )}
        </section>

        {isLeader && (
          <aside className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div><h3 className="font-extrabold text-slate-900">{editingId ? 'Edit checkpoint' : 'Add a stop'}</h3><p className="mt-1 text-[11px] text-slate-500">Share a helpful regrouping point.</p></div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-50 text-forest-700">{editingId ? <Pencil size={16} /> : <Plus size={17} />}</span>
            </div>
            <form onSubmit={submitCheckpoint} className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-600">Stop name<input required maxLength={120} value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="input mt-1.5 !rounded-xl !py-2.5 text-xs" placeholder="Fuel stop, scenic overlook…" /></label>
              <label className="block text-[10px] font-bold text-slate-600">Description <span className="font-normal text-slate-400">· optional</span><textarea maxLength={500} value={form.description} onChange={(event) => updateForm('description', event.target.value)} className="input mt-1.5 !rounded-xl text-xs" rows={2} placeholder="Anything riders should know?" /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[10px] font-bold text-slate-600">Latitude<input required type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(event) => updateForm('latitude', event.target.value)} className="input mt-1.5 !rounded-xl !py-2.5 text-xs" placeholder="22.5726" /></label>
                <label className="block text-[10px] font-bold text-slate-600">Longitude<input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(event) => updateForm('longitude', event.target.value)} className="input mt-1.5 !rounded-xl !py-2.5 text-xs" placeholder="88.3639" /></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[10px] font-bold text-slate-600">Stop number<input required type="number" min="1" value={form.sequence} onChange={(event) => updateForm('sequence', event.target.value)} className="input mt-1.5 !rounded-xl !py-2.5 text-xs" /></label>
                <label className="block text-[10px] font-bold text-slate-600">Planned time<input type="datetime-local" value={form.plannedArrivalAt} onChange={(event) => updateForm('plannedArrivalAt', event.target.value)} className="input mt-1.5 !rounded-xl !py-2.5 text-xs" /></label>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1 !rounded-xl !py-3 text-xs">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add checkpoint'}</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm(checkpoints.length + 1)); }} className="rounded-xl border border-slate-200 px-3 text-slate-500 transition hover:bg-slate-50" aria-label="Cancel editing"><X size={15} /></button>}
              </div>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
