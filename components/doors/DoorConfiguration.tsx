'use client';

import React from 'react';
import { Select, HardwareSelect } from './';
import type { BasicState, Domain, HardwareKit, Handle } from './types';
import { resetDependentParams, formatModelNameForCard, fmtInt, hasBasic, findHandleById, findHardwareKitById } from './utils';

interface ModelItem {
  model: string;
  modelKey?: string;
  style: string;
  photo?: string | null;
  photos?: { cover: string | null; gallery: string[] };
  hasGallery?: boolean;
}

interface PriceData {
  total: number;
  breakdown?: Array<{ label: string; amount: number }>;
}

interface DoorConfigurationProps {
  sel: Partial<BasicState>;
  setSel: React.Dispatch<React.SetStateAction<Partial<BasicState>>>;
  domain: Domain | null;
  hardwareKits: HardwareKit[];
  handles: Record<string, Handle[]>;
  price: PriceData | null;
  selectedModelCard: ModelItem | null;
  isLoadingOptions: boolean;
  showHandleInfo: boolean;
  setShowHandleInfo: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHandleModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddToCartClick: () => void;
  kpHtml: string;
  setKpHtml: React.Dispatch<React.SetStateAction<string>>;
}

export function DoorConfiguration({
  sel,
  setSel,
  domain,
  hardwareKits,
  handles,
  price,
  selectedModelCard,
  isLoadingOptions,
  showHandleInfo,
  setShowHandleInfo,
  setShowHandleModal,
  handleAddToCartClick,
  kpHtml,
  setKpHtml,
}: DoorConfigurationProps) {
  return (
    <section className="space-y-6">
      {/* Материалы и отделка */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Материалы и отделка</h3>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Покрытие"
            value={sel.finish || ""}
            onChange={(v: string) => setSel((s) => {
              const newSel = resetDependentParams(s, 'finish');
              newSel.finish = v;
              return newSel;
            })}
            options={(domain?.finish || []) as string[]}
            allowEmpty={true}
          />
          <Select
            label="Цвет"
            value={sel.color || ""}
            onChange={(v: string) => setSel((s) => {
              const newSel = resetDependentParams(s, 'color');
              newSel.color = v;
              return newSel;
            })}
            options={sel.finish ? (domain?.color || []) as string[] : []}
            allowEmpty={true}
            disabled={!sel.finish}
          />
        </div>
      </div>

      {/* Размеры */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Размеры</h3>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Ширина"
            value={sel.width?.toString() || ""}
            onChange={(v: string) => setSel((s) => {
              const newSel = resetDependentParams(s, 'width');
              newSel.width = Number(v);
              return newSel;
            })}
            options={domain?.width ? ((domain.width) as number[]).map(String) : []}
            allowEmpty={true}
            disabled={!sel.color}
            isLoading={isLoadingOptions}
          />
          <Select
            label="Высота"
            value={sel.height?.toString() || ""}
            onChange={(v: string) => setSel((s) => {
              const newSel = resetDependentParams(s, 'height');
              newSel.height = Number(v);
              return newSel;
            })}
            options={domain?.height ? ((domain.height) as number[]).map(String) : []}
            allowEmpty={true}
            disabled={!sel.width}
            isLoading={isLoadingOptions}
          />
        </div>
      </div>

      {/* Фурнитура */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Фурнитура</h3>
        <div className="space-y-4">
          <HardwareSelect
            label="Комплект фурнитуры"
            value={sel.hardware_kit?.id || ""}
            onChange={(v: string) => setSel((s) => ({ 
              ...s, 
              hardware_kit: v ? { id: v } : undefined
            }))}
            options={sel.width && sel.height ? hardwareKits.map(kit => ({
              id: kit.id,
              name: kit.name,
              price: kit.price,
              description: kit.description
            })) : []}
            allowEmpty={true}
            disabled={!sel.width || !sel.height}
          />
          <div className="text-sm space-y-1">
            <div className="text-gray-600">Ручка</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHandleModal(true)}
                disabled={!sel.hardware_kit}
                className={`flex-1 border border-black/20 px-3 py-2 text-left text-black ${
                  !sel.hardware_kit ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                }`}
              >
                {sel.handle?.id ? 
                  findHandleById(handles, sel.handle?.id)?.name || 'Выберите ручку' :
                  'Выберите ручку'
                }
              </button>
              {sel.handle?.id && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHandleInfo(!showHandleInfo)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Показать описание"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
                    {(() => {
                      const selectedHandle = sel.handle?.id ? findHandleById(handles, sel.handle?.id) : undefined;
                      return selectedHandle?.price !== undefined ? `${fmtInt(selectedHandle.price)} ₽` : '';
                    })()}
                  </div>
                </div>
              )}
              {/* Информация о ручке */}
              {showHandleInfo && sel.handle?.id && (() => {
                const selectedHandle = findHandleById(handles, sel.handle?.id);
                if (!selectedHandle) return null;
                return (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                    <div className="space-y-1">
                      <div><span className="font-medium">Группа:</span> {selectedHandle.group || 'Не указана'}</div>
                      <div><span className="font-medium">Поставщик:</span> {selectedHandle.supplier || 'Не указан'}</div>
                      <div><span className="font-medium">Наименование:</span> {selectedHandle.factoryName || 'Не указано'}</div>
                      <div><span className="font-medium">Артикул:</span> {selectedHandle.article || 'Не указан'}</div>
                      <div><span className="font-medium">Наличие в шоуруме:</span> {selectedHandle.showroom ? 'Да' : 'Нет'}</div>
                      <div><span className="font-medium">Цена:</span> {fmtInt(selectedHandle.price)} ₽</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Общая стоимость конфигурации */}
      {price && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4 border-t-2 border-t-gray-300">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-gray-700">Стоимость конфигурации</h3>
            <div className="text-xl font-bold text-gray-900">
              {fmtInt(price.total)} ₽
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="space-y-1">
              {/* Дверь + комплект фурнитуры */}
              <div className="flex justify-between">
                <span>
                  {sel.style && sel.model && sel.finish && sel.color && sel.width && sel.height && sel.hardware_kit?.id
                    ? `Дверь ${selectedModelCard ? formatModelNameForCard(selectedModelCard.model) : formatModelNameForCard(sel.model)} + комплект фурнитуры ${(() => {
                        if (!Array.isArray(hardwareKits) || hardwareKits.length === 0 || !sel.hardware_kit?.id) {
                          return 'Базовый';
                        }
                        const kit = findHardwareKitById(hardwareKits, sel.hardware_kit!.id);
                        return kit?.name ? kit.name.replace('Комплект фурнитуры — ', '') : 'Базовый';
                      })()}`
                    : "Дверь"}
                </span>
                <span>
                  {price?.breakdown?.find((item: any) => item.label === 'Дверь')?.amount && price?.breakdown?.find((item: any) => item.label.startsWith('Комплект:'))?.amount
                    ? `${fmtInt((price.breakdown.find((item: any) => item.label === 'Дверь').amount || 0) + (price.breakdown.find((item: any) => item.label.startsWith('Комплект:'))?.amount || 0))} ₽`
                    : price?.breakdown?.find((item: any) => item.label === 'Дверь')?.amount
                      ? `${fmtInt(price.breakdown.find((item: any) => item.label === 'Дверь').amount)} ₽`
                      : "—"}
                </span>
              </div>
              
              {/* Ручка */}
              {sel.handle?.id && (
                <div className="flex justify-between">
                  <span>
                    {(() => {
                      const selectedHandle = sel.handle?.id ? findHandleById(handles, sel.handle!.id) : undefined;
                      return selectedHandle?.name ? `Ручка ${selectedHandle.name}` : "Ручка";
                    })()}
                  </span>
                  <span>
                    {(() => {
                      const selectedHandle = sel.handle?.id ? findHandleById(handles, sel.handle!.id) : undefined;
                      return selectedHandle?.price !== undefined ? `${fmtInt(selectedHandle.price)} ₽` : "—";
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          disabled={!hasBasic(sel)}
          onClick={handleAddToCartClick}
          className="px-6 py-3 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          В корзину
        </button>
        {kpHtml && (
          <button
            className="px-6 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-lg font-bold"
            onClick={() => setKpHtml("")}
          >
            Скрыть КП
          </button>
        )}
      </div>

      {kpHtml && (
        <div className="bg-white border border-black/10 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Предпросмотр КП</h3>
          <iframe className="w-full h-80 border border-black/10" srcDoc={kpHtml} />
        </div>
      )}
    </section>
  );
}

