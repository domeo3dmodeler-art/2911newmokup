'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Item = {
  supplierSku: string;
  name: string;
  basePrice?: number|null;
  series?: string|null;
  finish?: string|null;
  color?: string|null;
  widthMm?: number|null;
  heightMm?: number|null;
  hasPhoto?: boolean;
};

type SearchResponse = {
  ok: boolean;
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
};

export default function DoorsCatalogPage(){
  const [q,setQ] = useState('');
  const [series,setSeries] = useState('');
  const [hasPhoto,setHasPhoto] = useState<'all'|'yes'|'no'>('all');
  const [minPrice,setMinPrice] = useState<string>('');
  const [maxPrice,setMaxPrice] = useState<string>('');
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(24);
  const [rows,setRows] = useState<Item[]>([]);
  const [total,setTotal] = useState(0);
  const [busy,setBusy] = useState(false);

  const qs = useMemo(()=>{
    const p = new URLSearchParams();
    if(q.trim()) p.set('q', q.trim());
    if(series) p.set('series', series);
    if(hasPhoto!=='all') p.set('hasPhoto', hasPhoto);
    if(minPrice) p.set('minPrice', minPrice);
    if(maxPrice) p.set('maxPrice', maxPrice);
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return p;
  },[q,series,hasPhoto,minPrice,maxPrice,page,pageSize]);

  useEffect(()=>{ let c=false; (async()=>{
    setBusy(true);
    try{
      const r = await fetch(`/api/catalog/doors/search?${qs.toString()}`);
      const j: SearchResponse = await r.json();
      if(!c){ setRows(j.items||[]); setTotal(j.total||0); }
    }catch{ if(!c){ setRows([]); setTotal(0); } }
    finally{ if(!c) setBusy(false); }
  })(); return ()=>{c=true} },[qs]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Каталог • Двери</div>
          <nav className="flex gap-2">
            <Link href="/" className="px-3 py-1.5 rounded-xl border">← Категории</Link>
            <Link href="/doors" className="px-3 py-1.5 rounded-xl border">Калькулятор</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid md:grid-cols-6 gap-3">
          <input value={q} onChange={e=>{ setPage(1); setQ(e.target.value) }} placeholder="Поиск: SKU или название" className="md:col-span-2 border rounded-xl px-3 py-2" />
          <input value={series} onChange={e=>{ setPage(1); setSeries(e.target.value) }} placeholder="Серия" className="border rounded-xl px-3 py-2" />
          <select value={hasPhoto} onChange={e=>{ setPage(1); setHasPhoto(e.target.value as any) }} className="border rounded-xl px-3 py-2">
            <option value="all">Фото: все</option>
            <option value="yes">Только с фото</option>
            <option value="no">Только без фото</option>
          </select>
          <input value={minPrice} onChange={e=>{ setPage(1); setMinPrice(e.target.value) }} placeholder="Цена от" className="border rounded-xl px-3 py-2" />
          <input value={maxPrice} onChange={e=>{ setPage(1); setMaxPrice(e.target.value) }} placeholder="Цена до" className="border rounded-xl px-3 py-2" />
        </div>

        <div className="text-sm text-gray-600">{busy ? 'Загрузка…' : `Найдено: ${total}`}</div>

        {rows.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {rows.map(it=> (
              <Link key={it.supplierSku} href={`/catalog/doors/${encodeURIComponent(it.supplierSku)}`} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
                <div className="aspect-[3/4] bg-gray-50" />
                <div className="p-3">
                  <div className="font-medium line-clamp-2">{it.name}</div>
                  <div className="text-xs text-gray-500">SKU: {it.supplierSku}</div>
                  <div className="text-sm font-semibold mt-1">{it.basePrice ? `${Math.round(it.basePrice).toLocaleString()} ₽` : '—'}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">Ничего не найдено</div>
        )}

        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1.5 rounded-xl border disabled:opacity-50">Назад</button>
          <div className="text-sm">Стр. {page} / {pages}</div>
          <button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="px-3 py-1.5 rounded-xl border disabled:opacity-50">Вперед</button>
          <select value={pageSize} onChange={e=>{ setPage(1); setPageSize(Number(e.target.value)) }} className="ml-2 border rounded-xl px-2 py-1 text-sm">
            {[12,24,48].map(n=><option key={n} value={n}>{n}/стр</option>)}
          </select>
        </div>
      </main>
    </div>
  );
}
