'use client';

import * as React from 'react';

type CartRow = {
  model: string;
  width: number;
  height: number;
  color?: string;
  qty: number;
  finish?: string;
  type?: string;
  productId?: string;
};

export default function ExportButtons({ getCart }: { getCart: () => CartRow[] }) {
  const [busy, setBusy] = React.useState<null | 'kp' | 'inv' | 'fac'>(null);

  const download = (filename: string, mime: string, content: string | Blob) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const post = async (path: string, body: any) => {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r;
  };

  const exportKP = async () => {
    const items = getCart();
    if (!items.length) return;
    setBusy('kp');
    try {
      const r = await post('/api/cart/export/doors/kp', { cart: { items } });
      const html = await r.text();
      download('kp.html', 'text/html;charset=utf-8', html);
    } finally {
      setBusy(null);
    }
  };

  const exportInvoice = async () => {
    const items = getCart();
    if (!items.length) return;
    setBusy('inv');
    try {
      const r = await post('/api/cart/export/doors/invoice', { cart: { items } });
      const html = await r.text();
      download('invoice.html', 'text/html;charset=utf-8', html);
    } finally {
      setBusy(null);
    }
  };

  const exportFactory = async () => {
    const items = getCart();
    if (!items.length) return;
    setBusy('fac');
    try {
      const r = await post('/api/cart/export/doors/factory', { cart: { items } });
      const csv = await r.text();
      download('factory.csv', 'text/csv;charset=utf-8', csv);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={exportKP}
        className="px-3 py-2 rounded-xl border disabled:opacity-50"
        disabled={busy !== null}
      >
        {busy === 'kp' ? 'Готовим КП…' : 'КП (HTML/PDF)'}
      </button>
      <button
        onClick={exportInvoice}
        className="px-3 py-2 rounded-xl border disabled:opacity-50"
        disabled={busy !== null}
      >
        {busy === 'inv' ? 'Готовим счёт…' : 'Счёт'}
      </button>
      <button
        onClick={exportFactory}
        className="px-3 py-2 rounded-xl border disabled:opacity-50"
        disabled={busy !== null}
      >
        {busy === 'fac' ? 'Готовим заказ…' : 'Заказ на фабрику'}
      </button>
    </div>
  );
}
