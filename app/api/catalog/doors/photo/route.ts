import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierSku = searchParams.get("supplier_sku");

    if (!supplierSku) {
      return NextResponse.json(
        { error: "Артикул поставщика не предоставлен" },
        { status: 400 }
      );
    }

    // В реальном приложении здесь был бы поиск в базе данных
    // Пока что возвращаем демо данные с расширенным списком
    const photoMapping: Record<string, string> = {
      "SUPPLIER-001": "/assets/doors/supplier-001.jpg",
      "SUPPLIER-002": "/assets/doors/supplier-002.jpg",
      "DOOR-001": "/assets/doors/door-001.jpg",
      "DOOR-002": "/assets/doors/door-002.jpg",
      "DOOR-MODERN-001": "/assets/doors/door-modern-001.jpg",
      "DOOR-MODERN-002": "/assets/doors/door-modern-002.jpg",
      "DOOR-CLASSIC-001": "/assets/doors/door-classic-001.jpg",
      "DOOR-CLASSIC-002": "/assets/doors/door-classic-002.jpg",
      "DOOR-NEO-001": "/assets/doors/door-neo-001.jpg",
      "DOOR-HIDDEN-001": "/assets/doors/door-hidden-001.jpg",
    };

    const photoUrl = photoMapping[supplierSku] || null;

    return NextResponse.json({
      supplier_sku: supplierSku,
      photo_url: photoUrl,
      found: !!photoUrl
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка поиска фото" },
      { status: 500 }
    );
  }
}
