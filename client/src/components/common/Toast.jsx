import { useCallback } from 'react';

let container = null;

const ensureContainer = () => {
  if (!container) {
    container = document.createElement('div');
    container.className =
      'fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }
  return container;
};

const toast = {
  success: (msg) => add('success', msg),
  error: (msg) => add('error', msg),
};

const add = (type, msg) => {
  const el = ensureContainer();
  const div = document.createElement('div');
  div.className = `pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium ${
    type === 'success'
      ? 'border-forest-200 bg-forest-50 text-forest-900'
      : 'border-red-200 bg-red-50 text-red-900'
  }`;
  div.innerHTML = `<span>${escapeHtml(msg)}</span>`;
  el.appendChild(div);
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transition = 'opacity 0.3s';
    setTimeout(() => div.remove(), 300);
  }, 4000);
};

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

export { toast };
