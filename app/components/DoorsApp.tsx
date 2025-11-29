"use client";
// Domeo • Doors — Single Canonical App (Configurator + Admin)
// CLEAN TS VERSION — 3-column configurator + Admin; inline cart editing + dependsOn-ready
import React, { useEffect, useMemo, useState } from 'react'

// ===================== Types =====================
type Product = {
  model: string;
  modelPhoto: string;
  style: string;
  finish: string;
  color: string;
  type: string;
  width: number;
  height: number;
  rrc_price: number;
  sku_1c: string;
  supplier: string;
  collection: string;
  supplier_item_name: string;
  supplier_color_finish: string;
  price_opt: number;
};

const order = ['style','model','finish','color','type','width','height'] as const;
type OrderKey = typeof order[number];

type CartItem = {
  id: string;
  style?: string;
  model?: string;
  finish?: string;
  type?: string;
  width?: number;
  height?: number;
  color?: string;
  qty: number;
  unitPrice: number;
  handleId?: string;
  sku_1c?: string | number | null;
  edge?: string;
  edge_note?: string;
  hardwareKitId?: string;
  baseAtAdd: number;
};

// ===================== Helpers =====================
const fmtInt = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const fmt2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2)
const uid = (): string => Math.random().toString(36).slice(2, 9)
const hasBasic = (s: { style?: string; model?: string; finish?: string; color?: string; type?: string; width?: number; height?: number; }): boolean => !!(s.style && s.model && s.finish && s.color && s.type && s.width && s.height)
const API = (typeof window !== 'undefined' && "") || null

// ===================== Mock Data =====================
const styleTiles = [
  { key: 'Скрытая', bg: 'linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%)' },
  { key: 'Современная', bg: 'linear-gradient(135deg,#e5f0ff 0%,#e0e7ff 100%)' },
  { key: 'Неоклассика', bg: 'linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)' },
  { key: 'Классика', bg: 'linear-gradient(135deg,#fef9c3 0%,#fde68a 100%)' },
]

const mockData: {
  products: Product[];
  kits: { id: string; name: string; group: number; price_rrc: number }[];
  handles: { id: string; name: string; supplier_name: string; supplier_sku: string; price_opt: number; price_rrc: number; price_group_multiplier: number }[];
} = {
  products: [
    { model: 'PG Base 1', modelPhoto: '/media/doors/pg-base-1.jpg', style: 'Современная', finish: 'Нанотекс', color: 'Белый', type: 'Распашная', width: 800, height: 2000, rrc_price: 21280, sku_1c: 'SKU-PG-800-2000-BEL', supplier: 'Supplier1', collection: 'Collection A', supplier_item_name: 'PG Base 1', supplier_color_finish: 'Белый/Нанотекс', price_opt: 13832 },
    { model: 'PO Base 1/1', modelPhoto: '/media/doors/po-base-1-1.jpg', style: 'Современная', finish: 'Нанотекс', color: 'Белый', type: 'Распашная', width: 800, height: 2000, rrc_price: 22900, sku_1c: 'SKU-PO11-800-2000-BEL', supplier: 'Supplier1', collection: 'Collection A', supplier_item_name: 'PO Base 1/1', supplier_color_finish: 'Белый/Нанотекс', price_opt: 14885 },
    { model: 'PO Base 1/2', modelPhoto: '/media/doors/po-base-1-2.jpg', style: 'Современная', finish: 'Нанотекс', color: 'Белый', type: 'Распашная', width: 900, height: 2000, rrc_price: 23900, sku_1c: 'SKU-PO12-900-2000-BEL', supplier: 'Supplier1', collection: 'Collection A', supplier_item_name: 'PO Base 1/2', supplier_color_finish: 'Белый/Нанотекс', price_opt: 15535 },
    { model: 'Neo-1', modelPhoto: '/media/doors/neo1.jpg', style: 'Неоклассика', finish: 'Эмаль', color: 'Слоновая кость', type: 'Распашная', width: 800, height: 2000, rrc_price: 27900, sku_1c: 'SKU-NEO1-800-2000-IV', supplier: 'Supplier2', collection: 'Neo', supplier_item_name: 'Neo-1', supplier_color_finish: 'Слоновая кость/Эмаль', price_opt: 18135 },
  ],
  kits: [
    { id: 'KIT_STD', name: 'Базовый комплект', group: 1, price_rrc: 5000 },
    { id: 'KIT_SOFT', name: 'SoftClose', group: 2, price_rrc: 2400 },
  ],
  handles: [
    { id: 'HNDL_PRO', name: 'Pro', supplier_name: 'HandleCo', supplier_sku: 'H-PRO', price_opt: 900, price_rrc: 1200, price_group_multiplier: 1.15 },
    { id: 'HNDL_SIL', name: 'Silver', supplier_name: 'HandleCo', supplier_sku: 'H-SIL', price_opt: 1100, price_rrc: 1400, price_group_multiplier: 1.15 },
  ],
}

// ============ API (mock) ============
const mockApi = {
  async getOptions(query: URLSearchParams) {
    // параметры запроса строго по допустимым ключам order
    const q = Object.fromEntries(query.entries()) as Partial<Record<OrderKey, string>>;

    const filtered = mockData.products.filter(p =>
      Object.entries(q).every(([k, v]) =>
        !v || String(p[k as keyof Product]) === String(v)
      )
    );

    // dependsOn-style domains
    const domain: Record<string, any> = {};
    for (const key of order) {
      const upstream = order.slice(0, order.indexOf(key));
      const subset = mockData.products.filter(p =>
        upstream.every((u: OrderKey) => {
          const val = q[u];
          return !val || String(p[u as keyof Product]) === String(val);
        })
      );

      // соберём значения безопасно: фильтруем тип-гардом и сортируем как строки (но с numeric:true)
      const values = Array.from(
        new Set(
          subset
            .map(p => p[key as keyof Product] as unknown as string | number | undefined)
        )
      ).filter((v): v is string | number => v !== undefined && v !== '');

      domain[key] = values.sort((a, b) =>
        String(a).localeCompare(String(b), 'ru', { numeric: true })
      );
    }

    domain.kits = mockData.kits;
    domain.handles = mockData.handles;

    for (const k of ['model','finish','color','type','width','height'] as const) {
      if (q.style || q.model) {
        const values = Array.from(
          new Set(
            filtered
              .map(p => p[k as keyof Product] as unknown as string | number | undefined)
          )
        ).filter((v): v is string | number => v !== undefined && v !== '');
        domain[k] = values.sort((a, b) =>
          String(a).localeCompare(String(b), 'ru', { numeric: true })
        );
      }
    }

    domain.style = Array.from(new Set((q.style ? filtered : mockData.products).map(p => p.style))).sort();
    return { ok: true as const, domain };
  },

  async listModelsByStyle(style?: string) {
    const rows = mockData.products.filter(p => !style || p.style === style)
    const seen = new Set<string>()
    const models = rows.filter(p => { if (seen.has(p.model)) return false; seen.add(p.model); return true })
    return models.map(p => ({ model: p.model, style: p.style, photo: p.modelPhoto }))
  },

  async price(selection: any){
    const p = mockData.products.find(x =>
      x.model === selection.model &&
      x.style === selection.style &&
      x.finish === selection.finish &&
      x.color === selection.color &&
      x.type === selection.type &&
      x.width === selection.width &&
      x.height === selection.height
    )
    if (!p) throw new Error('Combination not found')
    const kit = selection.hardware_kit && selection.hardware_kit.id ? mockData.kits.find(k => k.id === selection.hardware_kit.id) : undefined
    const handle = selection.handle && selection.handle.id ? mockData.handles.find(h => h.id === selection.handle.id) : undefined
    const base = p.rrc_price
    const addKit = kit ? kit.price_rrc : 0
    const addHandle = handle ? handle.price_rrc : 0
    const total = Math.round(base + addKit + addHandle)
    return { ok: true, currency: 'RUB', base, breakdown: [
      { label: 'Base RRC', amount: base },
      ...(kit ? [{ label: `Комплект: ${kit.name}`, amount: kit.price_rrc }] : []),
      ...(handle ? [{ label: `Ручка: ${handle.name}`, amount: handle.price_rrc }] : []),
    ], total, sku_1c: p.sku_1c }
  },

  async kp(cart: { items: CartItem[] }){
    const rows: string[] = []
    let n = 1
    for (const it of cart.items) {
      const parts: string[] = []
      if (it.width && it.height) parts.push(`${it.width}×${it.height}`)
      if (it.color) parts.push(it.color)
      if (it.edge === 'да') parts.push(`Кромка${it.edge_note ? `: ${it.edge_note}` : ''}`)
      const nameCore = `${it.model}${parts.length ? ` (${parts.join(', ')})` : ''}`
      const sum = it.unitPrice * it.qty
      rows.push(`<tr><td>${n}</td><td>${nameCore}</td><td class="num">${fmtInt(it.unitPrice)}</td><td class="num">${it.qty}</td><td class="num">${fmtInt(sum)}</td></tr>`)
      if (it.handleId) {
        const h = mockData.handles.find(h => h.id === it.handleId)
        if (h) {
          const handleRetail = Math.round(h.price_opt * h.price_group_multiplier)
          const hSum = handleRetail * it.qty
          rows.push(`<tr class="sub"><td></td><td>Ручка: ${h.name} — ${fmtInt(handleRetail)} × ${it.qty} = ${fmtInt(hSum)}</td><td class="num">${fmtInt(handleRetail)}</td><td class="num">${it.qty}</td><td class="num">${fmtInt(hSum)}</td></tr>`)
        }
      }
      n++
    }
    return `<!doctype html><html><head><meta charset="utf-8"/><style>
      body{font-family:ui-sans-serif,system-ui}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ddd;padding:8px}
      th{background:#f6f6f6;text-align:left}
      td.num{text-align:right}
      tr.sub td{color:#444;font-style:italic;background:#fafafa}
    </style></head><body>
      <h1>Коммерческое предложение — Doors</h1>
      <table><thead><tr><th>№</th><th>Наименование</th><th>Цена РРЦ, руб</th><th>Количество</th><th>Сумма, руб</th></tr></thead>
      <tbody>${rows.join('')}</tbody></table></body></html>`
  },

  async invoice(cart: { items: CartItem[] }){
    const total = cart.items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
    const rows = cart.items.flatMap((i, idx) => {
      const baseRow = `<tr>
        <td class="num">${idx+1}</td>
        <td>${i.sku_1c || '—'}</td>
        <td>${i.model} (${i.width}×${i.height}${i.color?`, ${i.color}`:''})</td>
        <td class="num">${fmtInt(i.unitPrice)}</td>
        <td class="num">${i.qty}</td>
        <td class="num">${fmtInt(i.unitPrice*i.qty)}</td>
      </tr>`
      const handle = i.handleId ? mockData.handles.find(h=>h.id===i.handleId) : undefined
      const handleRetail = handle ? Math.round(handle.price_opt * handle.price_group_multiplier) : 0
      const handleRow = handle ? `<tr class="sub">
        <td></td>
        <td>${handle.supplier_sku || '—'}</td>
        <td>Ручка: ${handle.name}</td>
        <td class="num">${fmtInt(handleRetail)}</td>
        <td class="num">${i.qty}</td>
        <td class="num">${fmtInt(handleRetail*i.qty)}</td>
      </tr>` : ''
      return [baseRow, handleRow]
    }).join('')

    return `<!doctype html><html><head><meta charset="utf-8"/><style>
      body{font-family:ui-sans-serif,system-ui}
      .row{display:flex;justify-content:space-between}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ddd;padding:8px}
      th{background:#f6f6f6;text-align:left}
      td.num{text-align:right}
      tr.sub td{color:#444;font-style:italic;background:#fafafa}
    </style></head><body>
      <h1>Счет на оплату</h1>
      <div class="row"><div>Покупатель: —</div><div>ИНН: —</div></div>
      <table><thead><tr><th>№</th><th>Артикул</th><th>Наименование</th><th>Цена, руб</th><th>Кол-во</th><th>Сумма, руб</th></tr></thead><tbody>
        ${rows}
      </tbody></table>
      <h3>Итого: ${fmtInt(total)} ₽</h3>
    </body></html>`
  },

  async factory(cart: { items: CartItem[] }){
    const header = [
      'N','Supplier','Collection','SupplierItemName','SupplierColorFinish',
      'Width','Height','HardwareKit','OptPrice','RetailPrice','Qty','SumOpt','SumRetail'
    ]
    let n = 0
    const lines = [header.join(',')]

    for (const i of cart.items) {
      n++
      const prod = mockData.products.find(p => p.model===i.model && p.width===i.width && p.height===i.height && p.color===i.color)
      const kit = i.hardwareKitId ? mockData.kits.find(k=>k.id===i.hardwareKitId) : undefined
      const opt = prod && prod.price_opt ? prod.price_opt : Math.round((prod && prod.rrc_price ? prod.rrc_price : 0) * 0.65)
      const retail = (prod && prod.rrc_price ? prod.rrc_price : 0) + (kit ? kit.price_rrc : 0)
      const sumOpt = opt * i.qty
      const sumRetail = retail * i.qty

      lines.push([
        String(n),
        (prod && prod.supplier) || '',
        (prod && prod.collection) || '',
        (prod && (prod.supplier_item_name || prod.model)) || '',
        (prod && prod.supplier_color_finish) || '',
        String(i.width||''),
        String(i.height||''),
        (kit ? `${kit.name} (гр. ${kit.group})` : ''),
        fmt2(opt), fmt2(retail),
        String(i.qty),
        fmt2(sumOpt), fmt2(sumRetail),
      ].join(','))

      if (i.handleId) {
        const h = mockData.handles.find(h=>h.id===i.handleId)
        if (h) {
          const hSumOpt = h.price_opt * i.qty
          const hRetail = h.price_opt * h.price_group_multiplier
          const hSumRetail = hRetail * i.qty
          lines.push([
            '',
            h.supplier_name,
            '',
            `Ручка: ${h.name}`,
            h.supplier_sku,
            '', '', '',
            fmt2(h.price_opt), fmt2(hRetail),
            String(i.qty),
            fmt2(hSumOpt), fmt2(hSumRetail),
          ].join(','))
        }
      }
    }
    return lines.join('\n')
  },
}

// ============ API (real) ============
const realApi = {
  async getOptions(query: URLSearchParams){
    const r = await fetch(`${API}/catalog/doors/options?${query.toString()}`)
    if (!r.ok) throw new Error(`options HTTP ${r.status}`)
    return r.json()
  },
  async listModelsByStyle(style?: string){
    const r = await fetch(`${API}/catalog/doors/models?style=${encodeURIComponent(style||'')}`)
    if (!r.ok) throw new Error(`models HTTP ${r.status}`)
    return r.json()
  },
  async price(selection: any){
    const r = await fetch(`${API}/price/doors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selection }) })
    if (!r.ok) throw new Error(`price HTTP ${r.status}`)
    return r.json()
  },
  async kp(cart: { items: CartItem[] }){
    const r = await fetch(`${API}/cart/export/doors/kp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart }) })
    if (!r.ok) throw new Error(`kp HTTP ${r.status}`)
    return r.text()
  },
  async invoice(cart: { items: CartItem[] }){
    const r = await fetch(`${API}/cart/export/doors/invoice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart }) })
    if (!r.ok) throw new Error(`invoice HTTP ${r.status}`)
    return r.text()
  },
  async factory(cart: { items: CartItem[] }){
    const r = await fetch(`${API}/cart/export/doors/factory`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart }) })
    if (!r.ok) throw new Error(`factory HTTP ${r.status}`)
    return r.text()
  },
  async register(email: string, password: string){
    const r = await fetch(`${API}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    return { ok: r.ok, status: r.status, text: await r.text() }
  },
  async login(email: string, password: string){
    const r = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const text = await r.text(); let token = ''; try{ const j = JSON.parse(text); token = j.token||'' }catch{}
    return { ok: r.ok, status: r.status, text, token }
  },
  async importPrice(token: string, category: string, file: File){
    const fd = new FormData(); fd.append('file', file)
    const r = await fetch(`${API}/admin/import/${category}`, { method: 'POST', headers: token?{ Authorization: `Bearer ${token}` }:undefined, body: fd })
    return { ok: r.ok, status: r.status, text: await r.text() }
  },
  async uploadMedia(token: string, files: FileList){
    const fd = new FormData(); Array.from(files).forEach(f=> fd.append('file', f))
    const r = await fetch(`${API}/admin/media/upload`, { method: 'POST', headers: token?{ Authorization: `Bearer ${token}` }:undefined, body: fd })
    return { ok: r.ok, status: r.status, text: await r.text() }
  },
}

const api = API ? realApi : mockApi

// ===================== App =====================
export default function App(){
  const [tab,setTab] = useState<'config'|'admin'>('config')

  // configurator state
  const [sel,setSel] = useState<{
    style?: string; model?: string; finish?: string; color?: string; type?: string;
    width?: number; height?: number; edge?: string; edge_note?: string;
    hardware_kit?: { id: string }; handle?: { id: string };
  }>({})
  const [domain,setDomain] = useState<any>(null)
  const [models,setModels] = useState<{ model: string; style: string; photo?: string }[]>([])
  const [price,setPrice] = useState<any>(null)
  const [cart,setCart] = useState<CartItem[]>([])
  const [kpHtml,setKpHtml] = useState<string>('')
  const [err,setErr] = useState<string|null>(null)
  const [editingId,setEditingId] = useState<string|null>(null)
  const [itemDomains, setItemDomains] = useState<Record<string, any>>({})

  const selectedModelCard = useMemo(()=> models.find(m=>m.model===sel.model) || null, [models, sel.model])

  const query = useMemo(()=>{ const q = new URLSearchParams(); (['style','model','finish','color','type','width','height'] as const).forEach(k=>{ const v = (sel as any)[k]; if(v!==undefined&&v!=='') q.set(k,String(v)) }); return q },[sel])

  useEffect(()=>{ let c=false; (async()=>{ try{ const r = await api.getOptions(query); if(!c) setDomain(r.domain) }catch(e:any){ if(!c) setErr(e?.message ?? 'Ошибка доменов') } })(); return ()=>{c=true} },[query])
  useEffect(()=>{ let c=false; (async()=>{ try{ const rows = (api.listModelsByStyle ? await api.listModelsByStyle(sel.style) : await mockApi.listModelsByStyle(sel.style)); if(!c) setModels(rows) }catch{} })(); return ()=>{c=true} },[sel.style])
  useEffect(()=>{ let c=false; (async()=>{ if(!hasBasic(sel)) { setPrice(null); return } try{ const p = await api.price(sel); if(!c) setPrice(p) }catch(e:any){ if(!c) setErr(e?.message ?? 'Ошибка расчёта') } })(); return ()=>{c=true} },[sel])

  const addToCart = ()=>{ if(!price) return; const item: CartItem = { id: uid(), style: sel.style, model: sel.model, finish: sel.finish, type: sel.type, width: sel.width, height: sel.height, color: sel.color, qty: 1, unitPrice: price.total, handleId: sel.handle && sel.handle.id || undefined, sku_1c: price.sku_1c, edge: sel.edge, edge_note: sel.edge_note, hardwareKitId: sel.hardware_kit && sel.hardware_kit.id || undefined, baseAtAdd: price.total }; setCart(c=>[...c,item]) }
  const removeFromCart = (id: string)=> setCart(c=>c.filter(i=>i.id!==id))
  const changeQty = (id: string,qty: number)=> setCart(c=>c.map(i=>i.id===id?{...i, qty: Math.max(1, qty)}:i))

  const ensureItemDomain = async (item:{ model: string; style?: string })=>{
    if(itemDomains[item.model]) return itemDomains[item.model]
    const q = new URLSearchParams(); q.set('model', item.model); if(item.style) q.set('style', item.style)
    try{ const r = await api.getOptions(q); setItemDomains(m=>({...m, [item.model]: r.domain })); return r.domain }catch{ return null }
  }

  const recalcItem = async (id: string)=>{
    const it = cart.find(x=>x.id===id)
    if(!it) return
    const selection: any = { style: it.style, model: it.model, finish: it.finish, color: it.color, type: it.type, width: it.width, height: it.height, hardware_kit: it.hardwareKitId?{id:it.hardwareKitId}:undefined, handle: it.handleId?{id:it.handleId}:undefined }
    try{ const p = await api.price(selection); setCart(c=>c.map(x=>x.id===id?{...x, unitPrice: p.total, sku_1c: p.sku_1c }:x)) }catch{/* keep old price */}
  }

  const changeItem = (id: string, patch: Partial<CartItem>)=>{ setCart(c=>c.map(i=> i.id===id? { ...i, ...patch } : i )) }

  const download = (filename:string,mime:string,content:string)=>{ const blob = new Blob([content],{type:mime}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url) }
  const exportKP = async()=>{ const html = await api.kp({ items: cart }); download('kp.html','text/html;charset=utf-8',html); setKpHtml(html) }
  const exportInvoice = async()=>{ const html = await api.invoice({ items: cart }); download('invoice.html','text/html;charset=utf-8',html) }
  const exportFactory = async()=>{ const csv = await api.factory({ items: cart }); download('factory.csv','text/csv;charset=utf-8',csv) }

  // admin
  const [email,setEmail] = useState('admin@example.com')
  const [password,setPassword] = useState('admin123')
  const [token,setToken] = useState('')
  const [category,setCategory] = useState('doors')
  const [out,setOut] = useState('')
  const reg = async()=>{ if(!API){ setOut('MOCK: registration skipped (set "")'); return } const r = await realApi.register(email,password); setOut(`${r.ok?'OK':'ERR'} ${r.status}: ${r.text}`) }
  const login = async()=>{ if(!API){ setToken('mock-token'); setOut('MOCK: logged in'); return } const r = await realApi.login(email,password); setOut(`${r.ok?'OK':'ERR'} ${r.status}: ${r.text}`); if(r.token) setToken(r.token) }
  const importPrice = async(e: React.FormEvent<HTMLFormElement>)=>{ e.preventDefault(); const file = (e.currentTarget.elements.namedItem('price') as HTMLInputElement)?.files?.[0]; if(!file){ setOut('Выберите файл'); return } if(!API){ setOut('MOCK: import skipped'); return } const r = await realApi.importPrice(token, category, file); setOut(`${r.ok?'OK':'ERR'} ${r.status}: ${r.text}`) }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Domeo • Doors</div>
          <div className="flex gap-2">
            <button onClick={()=>setTab('config')} className={`px-3 py-1.5 rounded-xl border ${tab==='config'?'bg-black text-white':''}`}>Конфигуратор</button>
            <button onClick={()=>setTab('admin')} className={`px-3 py-1.5 rounded-xl border ${tab==='admin'?'bg-black text-white':''}`}>Админ</button>
          </div>
        </div>
      </header>

      {tab==='config' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
          <main className="lg:col-span-1 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">Полотно</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {styleTiles.map(s=> (
                  <button key={s.key} onClick={()=>setSel(v=>({...v, style: s.key }))} className={`group overflow-hidden rounded-2xl shadow hover:shadow-lg transition ${sel.style===s.key?'ring-2 ring-black':''}`}>
                    <div className="aspect-[4/3] flex items-center justify-center" style={{ background: s.bg }}>
                      <div className="w-16 h-28 bg-white rounded-sm shadow-inner border border-black/10 relative"><div className="absolute right-1/4 top-1/2 w-4 h-1 bg-black/30"/></div>
                    </div>
                    <div className="p-3 text-left"><div className="font-medium">{s.key}</div><div className="text-xs text-gray-500">Выбрать стиль</div></div>
                  </button>
                ))}
              </div>
            </section>

            {sel.style && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold">Покрытие и цвет — Модели ({models.length})</h2>
                  <button className="text-sm underline" onClick={()=>setSel(v=>({...v, style:''}))}>Сбросить стиль</button>
                </div>
                {models.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {models.map(m=> (
                      <button key={m.model} onClick={()=>setSel(v=>({...v, model: m.model }))} className={`group rounded-2xl overflow-hidden shadow hover:shadow-lg transition ${sel.model===m.model?'ring-2 ring-black':''}`}>
                        <div className="aspect-[4/3] bg-gray-100" style={{ backgroundImage:`url(${m.photo})`, backgroundSize:'cover', backgroundPosition:'center' }} />
                        <div className="p-3 text-left"><div className="font-medium">{m.model}</div><div className="text-xs text-gray-500">{m.style}</div></div>
                      </button>
                    ))}
                  </div>
                ) : (<div className="text-gray-500">Нет моделей для выбранного стиля</div>)}
              </section>
            )}

            {sel.model && (
              <section className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Покрытие" value={sel.finish||''} onChange={(v:string)=>setSel(s=>({...s, finish:v}))} options={domain?.finish||[]} />
                  <Select label="Цвет" value={sel.color||''} onChange={(v:string)=>setSel(s=>({...s, color:v}))} options={domain?.color||[]} />
                  <Select label="Тип" value={sel.type||''} onChange={(v:string)=>setSel(s=>({...s, type:v}))} options={domain?.type||[]} />
                  <Select label="Ширина" value={sel.width?.toString()||''} onChange={(v:string)=>setSel(s=>({...s, width:Number(v)}))} options={(domain?.width||[]).map(String)} />
                  <Select label="Высота" value={sel.height?.toString()||''} onChange={(v:string)=>setSel(s=>({...s, height:Number(v)}))} options={(domain?.height||[]).map(String)} />
                  <Select label="Кромка" value={sel.edge||''} onChange={(v:string)=>setSel(s=>({...s, edge:v}))} options={['да','нет']} allowEmpty />
                  {sel.edge === 'да' && (
                    <label className="text-sm space-y-1"><div className="text-gray-600">Примечание к кромке</div><input value={sel.edge_note||''} onChange={e=>setSel(s=>({...s, edge_note:(e.target as HTMLInputElement).value}))} className="w-full border rounded-xl px-3 py-2" placeholder="например: ABS BLACK" /></label>
                  )}
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                  <h3 className="font-semibold">Выбор фурнитуры и ручек</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><Select label="Комплект фурнитуры" value={(sel.hardware_kit && sel.hardware_kit.id) || ''} onChange={(v:string)=>setSel(s=>({...s, hardware_kit: v?{id:v}:undefined}))} options={(domain?.kits||[]).map((k:any)=>k.id)} allowEmpty /></div>
                    <div><Select label="Ручка" value={(sel.handle && sel.handle.id) || ''} onChange={(v:string)=>setSel(s=>({...s, handle: v?{id:v}:undefined}))} options={(domain?.handles||[]).map((h:any)=>h.id)} allowEmpty /></div>
                  </div>
                </div>

                {kpHtml && (
                  <div className="bg-white rounded-2xl shadow p-4">
                    <h3 className="font-semibold mb-2">Предпросмотр КП</h3>
                    <iframe className="w-full h-80 border rounded" srcDoc={kpHtml} />
                  </div>
                )}
              </section>
            )}
          </main>

          <section className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow overflow-hidden max-w-sm mx-auto">
                <div className="aspect-[2/3] bg-gray-100" style={{ backgroundImage: (models.find(m=>m.model===sel.model)?.photo) ? `url(${models.find(m=>m.model===sel.model)!.photo})` : 'none', backgroundSize:'cover', backgroundPosition:'center' }}>
                  {!models.find(m=>m.model===sel.model)?.photo && (
                    <div className="w-full h-full flex items-center justify-center"><div className="w-24 h-48 bg-white rounded-sm shadow-inner border border-black/10 relative"><div className="absolute right-1/4 top-1/2 w-6 h-1 bg-black/30"/></div></div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="font-semibold mb-2">Параметры</h2>
                <div className="text-sm space-y-1">
                  <div><span className="text-gray-500">Стиль:</span> {sel.style||'—'}</div>
                  <div><span className="text-gray-500">Полотно:</span> {sel.model||'—'}</div>
                  <div><span className="text-gray-500">Покрытие и цвет:</span> {sel.finish||'—'}{sel.color?`, ${sel.color}`:''}</div>
                  <div><span className="text-gray-500">Кромка:</span> {sel.edge==='да' ? (sel.edge_note? `Кромка: ${sel.edge_note}` : 'Кромка') : 'Отсутствует'}</div>
                </div>
                <div className="mt-3 text-3xl font-bold">{price? `${fmtInt(price.total)} ₽` : '—'}</div>
                <div className="flex gap-3 mt-3">
                  <button disabled={!price} onClick={addToCart} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">В корзину</button>
                  <button disabled={!cart.length} onClick={exportKP} className="px-4 py-2 rounded-xl border disabled:opacity-50">КП</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">Корзина ({cart.length})</h2>
                  <div className="text-sm text-gray-600">Итого: <span className="font-semibold">{fmtInt(cart.reduce((s,i)=>s+i.unitPrice*i.qty,0))} ₽</span></div>
                </div>
                {cart.length ? (
                  <div className="space-y-2">
                    {cart.map(i=> (
                      <div key={i.id} className="border rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{i.model} — {i.type || '—'}</div>
                          <div className="text-sm">{fmtInt(i.unitPrice*i.qty)} ₽</div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {i.color ? `${i.color}, `: ''}{i.width}×{i.height}{i.edge==='да' ? `, Кромка${i.edge_note?`: ${i.edge_note}`:''}`:''}
                          {i.hardwareKitId ? `, Комплект: ${mockData.kits.find(k=>k.id===i.hardwareKitId)?.name}`: ''}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <input type="number" min={1} value={i.qty} className="w-16 border rounded py-1 text-center" onChange={e=>changeQty(i.id, Number((e.target as HTMLInputElement).value)||1)} />
                          <div className="text-xs text-gray-500">Δ {fmtInt(i.unitPrice - i.baseAtAdd)} ₽</div>
                          <div className="flex gap-2">
                            <button className="text-sm underline" onClick={async()=>{ setEditingId(editingId===i.id?null:i.id); if(editingId!==i.id) await ensureItemDomain({ model: i.model as string, style: i.style }) }}>Изменить</button>
                            <button className="text-red-600 text-sm" onClick={()=>removeFromCart(i.id)}>Удалить</button>
                          </div>
                        </div>
                        {editingId===i.id && (
                          <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-2">
                            <SelectMini label="Покрытие" value={i.finish||''} options={(itemDomains[i.model as string]?.finish)||[]} onChange={async (v:string)=>{ changeItem(i.id,{ finish:v }); await recalcItem(i.id) }} />
                            <SelectMini label="Цвет" value={i.color||''} options={(itemDomains[i.model as string]?.color)||[]} onChange={async (v:string)=>{ changeItem(i.id,{ color:v }); await recalcItem(i.id) }} />
                            <SelectMini label="Тип" value={i.type||''} options={(itemDomains[i.model as string]?.type)||[]} onChange={async (v:string)=>{ changeItem(i.id,{ type:v }); await recalcItem(i.id) }} />
                            <SelectMini label="Ширина" value={i.width?.toString()||''} options={((itemDomains[i.model as string]?.width)||[]).map(String)} onChange={async (v:string)=>{ changeItem(i.id,{ width:Number(v) }); await recalcItem(i.id) }} />
                            <SelectMini label="Высота" value={i.height?.toString()||''} options={((itemDomains[i.model as string]?.height)||[]).map(String)} onChange={async (v:string)=>{ changeItem(i.id,{ height:Number(v) }); await recalcItem(i.id) }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (<div className="text-gray-500">Корзина пуста</div>)}

                <div className="flex flex-wrap gap-2 mt-3">
                  <button disabled={!cart.length} onClick={exportInvoice} className="px-3 py-2 rounded-xl border disabled:opacity-50">Счет</button>
                  <button disabled={!cart.length} onClick={exportFactory} className="px-3 py-2 rounded-xl border disabled:opacity-50">Заказ на фабрику</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {tab==='admin' && (
        <div className="max-w-3xl mx-auto p-6 space-y-8">
          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold mb-3">Регистрация / Вход</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">Email<input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2"/></label>
              <label className="text-sm">Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2"/></label>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={reg} className="px-3 py-2 rounded-xl border">Зарегистрировать</button>
              <button onClick={login} className="px-3 py-2 rounded-xl border">Войти</button>
              <div className="text-xs text-gray-500">Токен: {token || '—'}</div>
            </div>
            {!API && <p className="text-xs text-gray-500 mt-2">Для реальных запросов установите API_URL</p>}
          </section>

          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold mb-3">Импорт прайса (XLSX/CSV)</h2>
            <form onSubmit={importPrice} className="space-y-3">
              <label className="text-sm block">Категория
                <select className="w-full border rounded px-3 py-2" value={category} onChange={e=>setCategory(e.target.value)}>
                  <option value="doors">doors</option>
                </select>
              </label>
              <input type="file" name="price" accept=".xlsx,.csv" className="block" />
              <button className="px-4 py-2 rounded-xl bg-black text-white" type="submit">Импортировать</button>
            </form>
          </section>

          <pre className="bg-gray-50 rounded-xl p-3 text-xs whitespace-pre-wrap">{out}</pre>
        </div>
      )}
    </div>
  )
}

function Select({ label, value, onChange, options, allowEmpty=false }:{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allowEmpty?: boolean;
}){
  return (
    <label className="text-sm space-y-1">
      <div className="text-gray-600">{label}</div>
      <select value={value} onChange={e=>onChange((e.target as HTMLSelectElement).value)} className="w-full border rounded-xl px-3 py-2">
        {allowEmpty && <option value="">—</option>}
        {options.map(o=> <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

function SelectMini({ label, value, onChange, options, allowEmpty=false }:{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allowEmpty?: boolean;
}){
  return (
    <label className="text-xs space-y-1">
      <div className="text-gray-600">{label}</div>
      <select value={value} onChange={e=>onChange((e.target as HTMLSelectElement).value)} className="w-full border rounded-lg px-2 py-1 text-xs">
        {allowEmpty && <option value="">—</option>}
        {options.map(o=> <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}
