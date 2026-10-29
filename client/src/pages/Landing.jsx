import {
  ArrowDownRight, ArrowRight, Check, MapPinned, MessageCircle,
  Navigation, Route, ShieldCheck, Sparkles, Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: MapPinned,
    tone: 'bg-emerald-50 text-emerald-700',
    title: 'Find your people on the map',
    text: 'Opt in to share your live location with your trip group. See who is moving, who is taking a break, and where the crew last checked in.',
  },
  {
    icon: MessageCircle,
    tone: 'bg-sky-50 text-sky-700',
    title: 'Keep the whole crew in sync',
    text: 'Trip-specific chat, planned checkpoints, and arrival updates keep the conversation connected to the ride.',
  },
  {
    icon: ShieldCheck,
    tone: 'bg-orange-50 text-orange-700',
    title: 'Make room for the unexpected',
    text: 'Trip-scoped SOS and breakdown alerts let your group know when someone needs a hand. They are in-app alerts, not emergency dispatch.',
  },
];

const steps = [
  ['01', 'Plan the route', 'Set your start, destination, date, and rider limit.'],
  ['02', 'Bring your crew', 'Share the unique trip code with your riders.'],
  ['03', 'Ride connected', 'Start the trip and share location when you choose.'],
];

export default function Landing() {
  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[720px] bg-[#f7f9f7] pt-32 sm:pt-36">
        <div className="pointer-events-none absolute -right-36 top-20 h-[560px] w-[560px] rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-48 top-80 h-[440px] w-[440px] rounded-full bg-sky-100/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:pb-28">
          <div className="max-w-2xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.13em] text-forest-800 shadow-sm">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" /></span>
              Made for the miles you share
            </span>
            <h1 className="text-balance text-5xl font-extrabold leading-[1.04] tracking-[-.045em] text-slate-950 sm:text-6xl lg:text-[70px]">
              Coordinate your group ride <span className="relative whitespace-nowrap text-forest-700">in real time<span className="absolute -bottom-1 left-0 -z-10 h-3 w-full rounded-full bg-emerald-200/70" /></span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Less “where did everyone go?” More riding together. Plan a trip, bring your crew, and share the journey on one simple map.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-700 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-forest-900/20 transition hover:-translate-y-0.5 hover:bg-forest-800">
                Start your next trip <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-forest-200 hover:text-forest-800">
                Sign in to your account
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-forest-700" /> Location sharing is opt-in</span>
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-forest-700" /> Private trip groups</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[530px] lg:ml-auto">
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-[28px] border border-emerald-200/70 bg-white/50" />
            <div className="absolute -bottom-8 -left-7 h-32 w-32 rounded-full bg-emerald-200/50 blur-2xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-white p-3 shadow-[0_35px_90px_-35px_rgba(15,57,40,.35)]">
              <div className="relative min-h-[440px] overflow-hidden rounded-[23px] bg-[#e8f0e9]">
                <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(#9dbbab 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 440" fill="none" aria-hidden="true">
                  <path d="M-20 312C63 269 95 330 170 291C251 249 250 178 324 199C385 216 397 150 545 110" stroke="#f8fbf8" strokeWidth="45" strokeLinecap="round" />
                  <path d="M-20 312C63 269 95 330 170 291C251 249 250 178 324 199C385 216 397 150 545 110" stroke="#a9c5b4" strokeWidth="2" strokeDasharray="4 9" />
                  <path d="M24 96C113 128 165 80 235 99C320 122 382 70 500 41" stroke="#fff" strokeWidth="24" strokeLinecap="round" />
                  <path d="M24 96C113 128 165 80 235 99C320 122 382 70 500 41" stroke="#bdd0c2" strokeWidth="2" strokeDasharray="4 8" />
                  <path d="M93 474C127 385 97 352 139 310C186 262 195 210 184 131" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
                  <path d="M93 474C127 385 97 352 139 310C186 262 195 210 184 131" stroke="#bdd0c2" strokeWidth="2" strokeDasharray="4 8" />
                </svg>
                <div className="absolute left-[27%] top-[58%] grid h-12 w-12 place-items-center rounded-full border-[5px] border-white bg-forest-700 text-white shadow-lg shadow-forest-900/30">
                  <Navigation size={18} fill="currentColor" />
                </div>
                <div className="absolute left-[63%] top-[41%] grid h-10 w-10 place-items-center rounded-full border-[4px] border-white bg-sky-600 text-white shadow-lg">
                  <span className="text-xs font-extrabold">J</span>
                </div>
                <div className="absolute left-[76%] top-[28%] grid h-10 w-10 place-items-center rounded-full border-[4px] border-white bg-orange-500 text-white shadow-lg">
                  <span className="text-xs font-extrabold">M</span>
                </div>
                <div className="absolute left-[17%] top-[70%] rounded-2xl border border-white/80 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-800">Your group, together</span>
                  </div>
                  <p className="mt-1 pl-4 text-[10px] text-slate-500">A shared route, on your terms</p>
                </div>
                <div className="absolute right-4 top-4 rounded-xl border border-white/80 bg-white/90 p-2.5 text-forest-800 shadow-md">
                  <Route size={17} />
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Sharing stays in your group
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-3 pb-1 pt-4">
                <div>
                  <p className="text-xs font-bold text-slate-900">A better way to ride as one</p>
                  <p className="mt-1 text-[10px] text-slate-500">Plan • Connect • Explore</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700"><Sparkles size={18} /></span>
              </div>
            </div>
          </div>
        </div>
        <a href="#how-it-works" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400 transition hover:text-forest-700 lg:flex">
          Discover how <ArrowDownRight size={14} />
        </a>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-forest-700">Everything in sync</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Your crew. One shared journey.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-500">Built for motorcycle rides, bicycle groups, road trips, and any adventure that’s better together.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, tone, title, text }, index) => (
              <article key={title} className="group rounded-[24px] border border-slate-200/80 bg-[#fbfcfb] p-6 transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl hover:shadow-emerald-950/5 sm:p-7">
                <span className={`mb-7 grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={21} /></span>
                <span className="text-[10px] font-bold tracking-[.15em] text-slate-400">0{index + 1}</span>
                <h3 className="mt-2 text-lg font-extrabold tracking-tight text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f3f7f3] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-forest-700">Three simple steps</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">From “let’s go” to on the road.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(([number, title, text]) => (
              <div key={number} className="relative rounded-[24px] border border-white bg-white p-6 shadow-sm sm:p-8">
                <span className="font-mono text-sm font-bold text-forest-700">{number}</span>
                <h3 className="mt-5 text-lg font-extrabold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 overflow-hidden rounded-[30px] bg-forest-950 px-7 py-10 text-white sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300"><Zap size={14} /> Your next ride starts here</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Bring your people along.</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-100/70">Plan a route, invite the crew, and decide when to share your location. You’re always in control.</p>
          </div>
          <Link to="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-forest-900 transition hover:-translate-y-0.5 hover:bg-emerald-50">
            Create your free account <ArrowRight size={17} />
          </Link>
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-5 text-slate-400">
          RideTogether alerts are delivered to your trip group and do not contact emergency services. Browser GPS may pause when a tab is suspended; location sharing is opt-in and can be stopped at any time.
        </p>
      </section>
    </div>
  );
}
