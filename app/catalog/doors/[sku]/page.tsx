"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoGallery } from "../../../../components/PhotoGallery";
import { clientLogger } from '@/lib/logging/client-logger';

export default function DoorProductPage({ params }: { params: { sku: string } }) {
  const router = useRouter();
  const sku = decodeURIComponent(params.sku);
  const [data, setData] = useState<{ product: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/catalog/products/by-sku/${encodeURIComponent(sku)}`);
        const result = await response.json();
        
        if (!cancelled) {
          if (result.success) {
            setData(result);
          } else {
            setData(null);
          }
        }
      } catch (error) {
        clientLogger.error('Ошибка загрузки товара:', error);
        if (!cancelled) {
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProduct();
    
    return () => {
      cancelled = true;
    };
  }, [sku]);

  const addToCalc = () => {
    // теперь калькулятор живет на /doors
    const q = new URLSearchParams({ sku });
    router.push(`/doors?${q.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-gray-200 rounded-2xl"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.product) {
    return <div className="max-w-4xl mx-auto p-6">Товар не найден</div>;
  }

  const product = data.product;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
              <PhotoGallery
                photos={product.photos.structure}
                productName={product.name}
                className="w-full"
                showModal={true}
                showArrows={true}
              />
        </div>
        <div className="space-y-3">
          <div className="text-xs text-gray-500">SKU: {sku}</div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.series && (
            <div className="text-sm text-gray-600">Серия: {product.series}</div>
          )}
          <div className="text-3xl font-semibold">
            {product.base_price
              ? new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "RUB",
                  maximumFractionDigits: 0,
                }).format(product.base_price)
              : "—"}
          </div>
          
          {/* Отображаем свойства товара */}
          {product.properties && (
            <div className="space-y-2 text-sm text-gray-600">
              {product.properties['Материал'] && (
                <div>Материал: {product.properties['Материал']}</div>
              )}
              {product.properties['Отделка'] && (
                <div>Отделка: {product.properties['Отделка']}</div>
              )}
              {product.properties['Цвет'] && (
                <div>Цвет: {product.properties['Цвет']}</div>
              )}
              {product.properties['Ширина/мм'] && product.properties['Высота/мм'] && (
                <div>
                  Размеры: {product.properties['Ширина/мм']}×{product.properties['Высота/мм']}×
                  {product.properties['Толщина/мм'] || '—'} мм
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={addToCalc}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
            >
              В расчёт
            </button>
            <a href="/catalog/doors" className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition-colors">
              В каталог
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
