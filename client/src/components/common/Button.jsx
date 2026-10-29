export default function Button({ children, variant = 'primary', size = 'md', className = '', onClick, disabled }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-forest-600 text-white focus:ring-forest-600 hover:bg-forest-700',
    outline: 'border border-slate-300 bg-white text-slate-700 focus:ring-forest-600 hover:bg-slate-50',
    danger: 'bg-red-600 text-white focus:ring-red-600 hover:bg-red-700',
    ghost: 'bg-transparent text-slate-600 focus:ring-slate-400 hover:bg-slate-100',
  };
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
