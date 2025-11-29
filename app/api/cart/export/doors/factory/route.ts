import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cart } = body;

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Корзина пуста" },
        { status: 400 }
      );
    }

    // Генерируем CSV для заказа на фабрику
    const header = [
      "N",
      "Supplier",
      "Collection", 
      "SupplierItemName",
      "SupplierColorFinish",
      "Width",
      "Height",
      "HardwareKit",
      "OptPrice",
      "RetailPrice",
      "Qty",
      "SumOpt",
      "SumRetail"
    ];

    const lines = [header.join(",")];

    cart.items.forEach((item: any, index: number) => {
      const optPrice = Math.round(item.unitPrice * 0.65); // Примерная оптовая цена
      const retailPrice = item.unitPrice;
      const sumOpt = optPrice * item.qty;
      const sumRetail = retailPrice * item.qty;

      const line = [
        String(index + 1),
        "Supplier1", // Демо данные
        "Collection A",
        item.model,
        `${item.color || ""}/${item.finish || ""}`,
        String(item.width || ""),
        String(item.height || ""),
        item.hardwareKitId || "",
        optPrice.toFixed(2),
        retailPrice.toFixed(2),
        String(item.qty),
        sumOpt.toFixed(2),
        sumRetail.toFixed(2)
      ].join(",");

      lines.push(line);
    });

    const csv = lines.join("\n");

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="factory_order.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка генерации заказа на фабрику" },
      { status: 500 }
    );
  }
}
