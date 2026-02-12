 'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { clientLogger } from '@/lib/logging/client-logger';

interface CatalogCategory {
  id: string;
  name: string;
  level?: number;
  product_count?: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  base_price: number;
  stock_quantity: number;
  is_active?: boolean;
  properties_data?: Record<string, unknown>;
  images?: Array<{ id: string; url: string; is_primary: boolean; sort_order: number }>;
}

interface PropertyPhoto {
  id: string;
  categoryId: string;
  propertyName: string;
  propertyValue: string;
  photoPath: string;
  photoType: string;
}

type Tab = 'import-doors' | 'products' | 'photos';

export default function CatalogImportPage() {
  const [tab, setTab] = useState<Tab>('import-doors');
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [doorsPackageFile, setDoorsPackageFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importLog, setImportLog] = useState<string>('');

  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsBusy, setProductsBusy] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedPropertiesJson, setEditedPropertiesJson] = useState('{}');
  const [editBusy, setEditBusy] = useState(false);

  const [photoCategoryId, setPhotoCategoryId] = useState('');
  const [photoMappingProperty, setPhotoMappingProperty] = useState('Артикул поставщика');
  const [photoUploadType, setPhotoUploadType] = useState<'property' | 'product'>('property');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhoto[]>([]);
  const [photoSearch, setPhotoSearch] = useState('');
  const [manualPropertyName, setManualPropertyName] = useState('Артикул поставщика');
  const [manualPropertyValue, setManualPropertyValue] = useState('');
  const [manualPhotoType, setManualPhotoType] = useState('cover');
  const [manualPhotoPath, setManualPhotoPath] = useState('');

  const [galleryScope, setGalleryScope] = useState<'color' | 'code'>('color');
  const [galleryPropertyValue, setGalleryPropertyValue] = useState('');
  const [galleryCoverFile, setGalleryCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryBusy, setGalleryBusy] = useState(false);

  const apiUnwrap = (payload: any) => payload?.data ?? payload;

  const uniqueColorValues = useMemo(() => {
    const set = new Set(
      propertyPhotos
        .filter((p) => p.propertyName === 'Domeo_Модель_Цвет')
        .map((p) => p.propertyValue)
    );
    return Array.from(set).sort();
  }, [propertyPhotos]);

  const loadCategories = async () => {
    const response = await fetch('/api/catalog/categories-flat');
    const payload = await response.json();
    const data = apiUnwrap(payload);
    setCatalogCategories(data.categories || []);
  };

  const loadProducts = async () => {
    if (!selectedCategoryId) return;
    setProductsBusy(true);
    try {
      const q = new URLSearchParams({
        categoryId: selectedCategoryId,
        limit: '100',
        ...(productSearch ? { search: productSearch } : {}),
      });
      const response = await fetch(`/api/catalog/products?${q.toString()}`);
      const payload = await response.json();
      const data = apiUnwrap(payload);
      setProducts(data.products || []);
    } finally {
      setProductsBusy(false);
    }
  };

  const loadPropertyPhotos = async () => {
    if (!photoCategoryId) return;
    const q = new URLSearchParams({ categoryId: photoCategoryId });
    const response = await fetch(`/api/admin/property-photos?${q.toString()}`);
    const payload = await response.json();
    const data = apiUnwrap(payload);
    setPropertyPhotos(data.photos || []);
  };

  useEffect(() => {
    loadCategories().catch((e) => clientLogger.error('loadCategories failed', e));
  }, []);

  useEffect(() => {
    loadProducts().catch((e) => clientLogger.error('loadProducts failed', e));
  }, [selectedCategoryId]);

  useEffect(() => {
    loadPropertyPhotos().catch((e) => clientLogger.error('loadPropertyPhotos failed', e));
  }, [photoCategoryId]);

  useEffect(() => {
    if (!selectedProduct) return;
    setEditedPropertiesJson(JSON.stringify(selectedProduct.properties_data || {}, null, 2));
  }, [selectedProduct]);

  const filteredPropertyPhotos = useMemo(
    () =>
      propertyPhotos.filter((p) =>
        `${p.propertyName} ${p.propertyValue} ${p.photoType} ${p.photoPath}`
          .toLowerCase()
          .includes(photoSearch.toLowerCase()),
      ),
    [propertyPhotos, photoSearch],
  );

  const runPreview = async () => {
    if (!selectedCategoryId || !importFile) {
      alert('Выберите категорию и файл.');
      return;
    }
    setImportBusy(true);
    setImportLog('');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('category', selectedCategoryId);
      formData.append('mode', 'preview');
      const response = await fetch('/api/admin/import/unified', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      const data = apiUnwrap(payload);
      setImportPreview(data);
      setImportLog(`Preview OK. Валидных: ${data?.data?.validProducts ?? 0}, ошибок: ${data?.data?.errors ?? 0}`);
    } catch (e) {
      setImportLog(`Preview ошибка: ${(e as Error).message}`);
    } finally {
      setImportBusy(false);
    }
  };

  const runImport = async () => {
    if (!selectedCategoryId || !importFile) {
      alert('Выберите категорию и файл.');
      return;
    }
    setImportBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('category', selectedCategoryId);
      formData.append('mode', 'import');
      const response = await fetch('/api/admin/import/unified', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      const data = apiUnwrap(payload);
      setImportLog(`Импорт: imported=${data.imported}, created=${data.created}, updated=${data.updated}, errors=${data.errors}`);
      await loadProducts();
    } catch (e) {
      setImportLog(`Импорт ошибка: ${(e as Error).message}`);
    } finally {
      setImportBusy(false);
    }
  };

  const exportDoorsPackage = async () => {
    try {
      const response = await fetch('/api/admin/import/doors-package');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doors_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setImportLog('Выгрузка doors из БД выполнена.');
    } catch (e) {
      setImportLog(`Ошибка выгрузки: ${(e as Error).message}`);
    }
  };

  const importDoorsPackage = async () => {
    if (!doorsPackageFile) {
      alert('Выберите xlsx файл для импорта doors.');
      return;
    }
    setImportBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', doorsPackageFile);
      const response = await fetch('/api/admin/import/doors-package', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      setImportLog(`Импорт doors завершён.\n${payload?.message || ''}`);
      await loadProducts();
    } catch (e) {
      setImportLog(`Ошибка импорта doors: ${(e as Error).message}`);
    } finally {
      setImportBusy(false);
    }
  };

  const saveProduct = async () => {
    if (!selectedProduct) return;
    setEditBusy(true);
    try {
      const parsed = JSON.parse(editedPropertiesJson);
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties_data: parsed, name: selectedProduct.name, base_price: selectedProduct.base_price }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      alert('Товар обновлен');
      await loadProducts();
    } catch (e) {
      alert(`Ошибка сохранения: ${(e as Error).message}`);
    } finally {
      setEditBusy(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Удалить товар?')) return;
    const response = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) {
      alert(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      return;
    }
    if (selectedProduct?.id === productId) setSelectedProduct(null);
    await loadProducts();
  };

  const uploadPhotos = async () => {
    if (!photoCategoryId || !photoMappingProperty || photoFiles.length === 0) {
      alert('Выберите категорию, свойство и файлы.');
      return;
    }
    setPhotoBusy(true);
    try {
      const formData = new FormData();
      photoFiles.forEach((f) => formData.append('photos', f));
      formData.append('category', photoCategoryId);
      formData.append('mapping_property', photoMappingProperty);
      formData.append('upload_type', photoUploadType);
      const response = await fetch('/api/admin/import/photos', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      const data = apiUnwrap(payload);
      alert(`Фото обработаны: uploaded=${data.uploaded}, linked=${data.linked}, errors=${data.errors}`);
      await loadPropertyPhotos();
      setPhotoFiles([]);
    } catch (e) {
      alert(`Ошибка загрузки фото: ${(e as Error).message}`);
    } finally {
      setPhotoBusy(false);
    }
  };

  const deletePropertyPhoto = async (id: string) => {
    if (!confirm('Удалить фото свойства?')) return;
    const q = new URLSearchParams({ id });
    const response = await fetch(`/api/admin/property-photos?${q.toString()}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) {
      alert(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      return;
    }
    await loadPropertyPhotos();
  };

  const upsertPropertyPhotoManual = async () => {
    if (!photoCategoryId || !manualPropertyName || !manualPropertyValue || !manualPhotoPath) {
      alert('Заполните category/property/value/path.');
      return;
    }
    const response = await fetch('/api/admin/property-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: photoCategoryId,
        propertyName: manualPropertyName,
        propertyValue: manualPropertyValue,
        photoType: manualPhotoType,
        photoPath: manualPhotoPath,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      alert(payload?.error?.message || payload?.error || `HTTP ${response.status}`);
      return;
    }
    alert('Property photo сохранено.');
    await loadPropertyPhotos();
  };

  const uploadAndSaveGallery = async () => {
    if (!photoCategoryId || !galleryPropertyValue.trim()) {
      alert('Выберите категорию и укажите значение (цвет или артикул).');
      return;
    }
    if (!galleryCoverFile && galleryFiles.length === 0) {
      alert('Добавьте обложку или хотя бы одно фото галереи.');
      return;
    }
    setGalleryBusy(true);
    try {
      const formData = new FormData();
      if (galleryCoverFile) formData.append('cover', galleryCoverFile);
      galleryFiles.forEach((f) => formData.append('gallery', f));
      const uploadRes = await fetch('/api/admin/upload-gallery-files', { method: 'POST', body: formData });
      const uploadPayload = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadPayload?.error?.message || uploadPayload?.error || `HTTP ${uploadRes.status}`);
      }
      const { coverPath, galleryPaths } = apiUnwrap(uploadPayload) || {};
      const res = await fetch('/api/admin/property-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: photoCategoryId,
          scope: galleryScope,
          propertyValue: galleryPropertyValue.trim(),
          coverPath: coverPath || undefined,
          galleryPaths: galleryPaths || [],
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || payload?.error || `HTTP ${res.status}`);
      alert('Галерея сохранена.');
      setGalleryCoverFile(null);
      setGalleryFiles([]);
      await loadPropertyPhotos();
    } catch (e) {
      alert(`Ошибка: ${(e as Error).message}`);
    } finally {
      setGalleryBusy(false);
    }
  };

  const moveGalleryFile = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= galleryFiles.length) return;
    const arr = [...galleryFiles];
    [arr[index], arr[next]] = [arr[next], arr[index]];
    setGalleryFiles(arr);
  };

  const removeGalleryFile = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Админ импорт и управление каталогом</h1>
          <p className="mt-2 text-gray-600">Новый модуль: preview/import, редактирование и удаление товаров, управление фото.</p>
        </div>

        <div className="mb-6 flex gap-2">
          {(['import-doors', 'products', 'photos'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded border ${tab === t ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              {t === 'import-doors' ? 'Импорт doors' : t === 'products' ? 'Товары' : 'Фото'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Категория</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  if (!photoCategoryId) setPhotoCategoryId(e.target.value);
                }}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Выберите категорию...</option>
                {catalogCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {typeof c.product_count === 'number' ? `(${c.product_count})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Поиск товара</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2"
                  placeholder="SKU/название..."
                />
                <button onClick={() => loadProducts()} className="px-4 py-2 rounded bg-gray-100 border border-gray-300">
                  Найти
                </button>
              </div>
            </div>
          </div>

          {tab === 'import-doors' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Импорт doors (Preview / Apply)</h3>
              <div className="border border-gray-200 rounded p-3 space-y-3">
                <div className="font-medium text-sm">Полный пакет doors (БД ⇄ XLSX)</div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button onClick={exportDoorsPackage} className="px-4 py-2 rounded bg-indigo-600 text-white">
                    Выгрузить из БД весь Импорт doors
                  </button>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setDoorsPackageFile(e.target.files?.[0] || null)}
                  />
                  <button onClick={importDoorsPackage} disabled={importBusy} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">
                    Загрузить пакет doors обратно (merge add/update)
                  </button>
                </div>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="block"
              />
              <div className="flex gap-2">
                <button onClick={runPreview} disabled={importBusy} className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-50">
                  Preview
                </button>
                <button onClick={runImport} disabled={importBusy} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                  Применить импорт
                </button>
              </div>
              {importLog && <div className="text-sm bg-gray-50 border border-gray-200 rounded p-3">{importLog}</div>}
              {importPreview && (
                <pre className="text-xs overflow-auto bg-gray-50 border border-gray-200 rounded p-3">
                  {JSON.stringify(importPreview, null, 2)}
                </pre>
              )}
            </div>
          )}

          {tab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Товары категории</h3>
                <div className="border rounded max-h-[500px] overflow-auto">
                  {productsBusy ? (
                    <div className="p-3 text-sm text-gray-500">Загрузка...</div>
                  ) : products.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">Товары не найдены.</div>
                  ) : (
                    products.map((p) => (
                      <div key={p.id} className={`p-3 border-b last:border-b-0 ${selectedProduct?.id === p.id ? 'bg-blue-50' : ''}`}>
                        <div className="flex justify-between gap-2">
                          <button className="text-left flex-1" onClick={() => setSelectedProduct(p)}>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-600">{p.sku}</div>
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="text-xs px-2 py-1 rounded border border-red-300 text-red-700">
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Редактирование товара</h3>
                {selectedProduct ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700">
                      <div><b>ID:</b> {selectedProduct.id}</div>
                      <div><b>SKU:</b> {selectedProduct.sku}</div>
                    </div>
                    <textarea
                      value={editedPropertiesJson}
                      onChange={(e) => setEditedPropertiesJson(e.target.value)}
                      className="w-full h-[360px] border border-gray-300 rounded p-2 font-mono text-xs"
                    />
                    <button onClick={saveProduct} disabled={editBusy} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50">
                      Сохранить
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Выберите товар слева.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'photos' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Фото: загрузка и редактирование</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <label className="text-sm text-gray-600">Категория для фото</label>
                  <select
                    value={photoCategoryId}
                    onChange={(e) => setPhotoCategoryId(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Выберите...</option>
                    {catalogCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm text-gray-600">Свойство привязки</label>
                  <input
                    value={photoMappingProperty}
                    onChange={(e) => setPhotoMappingProperty(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm text-gray-600">Тип загрузки</label>
                  <select
                    value={photoUploadType}
                    onChange={(e) => setPhotoUploadType(e.target.value as 'property' | 'product')}
                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="property">property_photos</option>
                    <option value="product">photos в товаре</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm text-gray-600">Файлы</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                    className="mt-1 block w-full text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={uploadPhotos} disabled={photoBusy} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                  Загрузить фото
                </button>
                <button onClick={loadPropertyPhotos} className="px-4 py-2 rounded bg-gray-100 border border-gray-300">
                  Обновить список
                </button>
              </div>
              <div className="border border-gray-200 rounded p-3 space-y-2">
                <div className="text-sm font-medium">Ручное создание/редактирование PropertyPhoto</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input value={manualPropertyName} onChange={(e) => setManualPropertyName(e.target.value)} className="border border-gray-300 rounded px-2 py-1" placeholder="propertyName" />
                  <input value={manualPropertyValue} onChange={(e) => setManualPropertyValue(e.target.value)} className="border border-gray-300 rounded px-2 py-1" placeholder="propertyValue" />
                  <input value={manualPhotoType} onChange={(e) => setManualPhotoType(e.target.value)} className="border border-gray-300 rounded px-2 py-1" placeholder="photoType: cover/gallery_1" />
                  <input value={manualPhotoPath} onChange={(e) => setManualPhotoPath(e.target.value)} className="border border-gray-300 rounded px-2 py-1" placeholder="/uploads/..." />
                </div>
                <button onClick={upsertPropertyPhotoManual} className="px-3 py-2 rounded bg-gray-900 text-white text-sm">
                  Сохранить PropertyPhoto
                </button>
              </div>
              <div className="border border-gray-200 rounded p-4 space-y-3 bg-gray-50">
                <h4 className="font-semibold">Галерея фото (обложка + галерея)</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Область</label>
                    <select
                      value={galleryScope}
                      onChange={(e) => setGalleryScope(e.target.value as 'color' | 'code')}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="color">Цвет (Domeo_Модель_Цвет)</option>
                      <option value="code">Код модели (Артикул поставщика)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">
                      {galleryScope === 'color' ? 'Значение цвета (Модель|Покрытие|Цвет)' : 'Артикул поставщика'}
                    </label>
                    <input
                      value={galleryPropertyValue}
                      onChange={(e) => setGalleryPropertyValue(e.target.value)}
                      list="gallery-color-values"
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                      placeholder={galleryScope === 'color' ? 'например Model|ПВХ|Белый' : 'код модели'}
                    />
                    {galleryScope === 'color' && uniqueColorValues.length > 0 && (
                      <datalist id="gallery-color-values">
                        {uniqueColorValues.map((v) => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Обложка (одно фото)</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setGalleryCoverFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm"
                      />
                      {galleryCoverFile && (
                        <span className="text-sm text-gray-600 truncate max-w-[180px]">{galleryCoverFile.name}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Галерея (несколько фото, порядок можно менять)</label>
                    <div
                      className="mt-1 border-2 border-dashed border-gray-300 rounded p-4 text-center text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-50"
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50'); }}
                      onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                        if (files.length) setGalleryFiles((prev) => [...prev, ...files]);
                      }}
                    >
                      Перетащите сюда изображения или выберите файлы ниже
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setGalleryFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
                      className="mt-2 block w-full text-sm"
                    />
                  </div>
                </div>
                {galleryFiles.length > 0 && (
                  <ul className="list-none space-y-1">
                    {galleryFiles.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm py-1 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500 w-6">{i + 1}.</span>
                        <span className="flex-1 truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => moveGalleryFile(i, -1)}
                          disabled={i === 0}
                          className="px-2 py-0.5 rounded border border-gray-300 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryFile(i, 1)}
                          disabled={i === galleryFiles.length - 1}
                          className="px-2 py-0.5 rounded border border-gray-300 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button type="button" onClick={() => removeGalleryFile(i)} className="px-2 py-0.5 rounded border border-red-300 text-red-700">
                          Удалить
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={uploadAndSaveGallery}
                  disabled={galleryBusy}
                  className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
                >
                  {galleryBusy ? 'Загрузка...' : 'Загрузить и сохранить галерею'}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={photoSearch}
                  onChange={(e) => setPhotoSearch(e.target.value)}
                  placeholder="Поиск property photos..."
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="border rounded max-h-[440px] overflow-auto">
                {filteredPropertyPhotos.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Фото не найдены.</div>
                ) : (
                  filteredPropertyPhotos.map((p) => (
                    <div key={p.id} className="p-3 border-b last:border-b-0">
                      <div className="flex justify-between items-start gap-3">
                        <div className="text-sm">
                          <div><b>{p.propertyName}</b> = {p.propertyValue}</div>
                          <div className="text-gray-600">{p.photoType}</div>
                          <div className="text-xs text-gray-500">{p.photoPath}</div>
                        </div>
                        <button onClick={() => deletePropertyPhoto(p.id)} className="text-xs px-2 py-1 rounded border border-red-300 text-red-700">
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}