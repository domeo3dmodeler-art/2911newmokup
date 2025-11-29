"use client";

import { useState } from "react";

type CartItem = {
  productId: number;
  qty?: number;
  kitId?: string;
  handleId?: string;
};

type Props = {
  // функция, которая вернёт текущую корзину из твоего стейта
  getCart: () => CartItem[];
  // ID принятого КП для экспорта заказа на фабрику
  acceptedKPId?: string;
};

type Busy =
  | null
  | "kp"
  | "invoice"
  | "factoryCsv"
  | "factoryXlsx"
  | "orderExport";

type ExportKind = "html" | "csv" | "xlsx";

export default function ExportButtons({ getCart, acceptedKPId }: Props) {
  const [busy, setBusy] = useState<Busy>(null);

  function resolveBusy(path: string, kind: ExportKind): Busy {
    if (path.includes("/kp")) return "kp";
    if (path.includes("/invoice")) return "invoice";
    if (kind === "xlsx") return "factoryXlsx";
    return "factoryCsv";
  }

  async function postAndOpen(path: string, kind: ExportKind) {
    try {
      setBusy(resolveBusy(path, kind));

      const body = JSON.stringify({ cart: getCart() ?? [] });

      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} — ${txt}`);
      }

      const blob = await res.blob();

      if (kind === "html") {
        // Открыть в новой вкладке
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        // Чуть позже освобождаем URL
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        // Скачать файл (CSV/XLSX)
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = kind === "csv" ? "factory.csv" : "factory.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      alert(e?.message ?? "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function exportOrderToFactory() {
    if (!acceptedKPId) {
      alert("Необходимо указать ID принятого КП для экспорта заказа на фабрику");
      return;
    }

    try {
      setBusy("orderExport");

      const res = await fetch("/api/export/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpId: acceptedKPId,
          format: "xlsx"
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status} — Ошибка экспорта`);
      }

      const blob = await res.blob();
      
      // Скачать файл
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factory_order_${acceptedKPId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "Экспорт заказа на фабрику не удался");
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        onClick={() => postAndOpen("/api/cart/export/doors/kp", "html")}
        disabled={disabled}
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
      >
        {busy === "kp" ? "Генерация КП…" : "КП (HTML)"}
      </button>

      <button
        onClick={() => postAndOpen("/api/cart/export/doors/invoice", "html")}
        disabled={disabled}
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
      >
        {busy === "invoice" ? "Генерация счёта…" : "Счёт (HTML)"}
      </button>

      <button
        onClick={() => postAndOpen("/api/cart/export/doors/factory", "csv")}
        disabled={disabled}
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
      >
        {busy === "factoryCsv" ? "Подготовка CSV…" : "Заказ (CSV)"}
      </button>

      <button
        onClick={() => postAndOpen("/api/cart/export/doors/factory/xlsx", "xlsx")}
        disabled={disabled}
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
      >
        {busy === "factoryXlsx" ? "Подготовка XLSX…" : "Заказ (XLSX)"}
      </button>

      <button
        onClick={exportOrderToFactory}
        disabled={disabled || !acceptedKPId}
        style={{ 
          padding: "8px 12px", 
          borderRadius: 8, 
          border: "1px solid #ddd",
          backgroundColor: acceptedKPId ? "#f0f8ff" : "#f5f5f5",
          opacity: acceptedKPId ? 1 : 0.6
        }}
        title={acceptedKPId ? "Экспорт заказа на фабрику из принятого КП" : "Необходимо указать ID принятого КП"}
      >
        {busy === "orderExport" ? "Экспорт заказа…" : "Заказ на фабрику"}
      </button>
    </div>
  );
}
