import { NextRequest, NextResponse } from "next/server";

// Универсальное получение фото по категории и артикулу поставщика
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const supplierSku = searchParams.get("supplier_sku");

    if (!category) {
      return NextResponse.json(
        { error: "Категория не предоставлена" },
        { status: 400 }
      );
    }

    if (!supplierSku) {
      return NextResponse.json(
        { error: "Артикул поставщика не предоставлен" },
        { status: 400 }
      );
    }

    // Получаем информацию о категории
    const categoriesResponse = await fetch(`${req.nextUrl.origin}/api/categories`);
    const categoriesData = await categoriesResponse.json();
    const categoryInfo = categoriesData.categories.find((cat: any) => cat.id === category);

    if (!categoryInfo) {
      return NextResponse.json(
        { error: `Категория "${category}" не найдена` },
        { status: 404 }
      );
    }

    // В реальном приложении здесь был бы поиск в базе данных
    // Пока что возвращаем демо данные с расширенным списком
    const photoMapping: Record<string, Record<string, string>> = {
      "doors": {
        "DOOR-MODERN-001": "/assets/doors/door-modern-001.jpg",
        "DOOR-MODERN-002": "/assets/doors/door-modern-002.jpg",
        "DOOR-CLASSIC-001": "/assets/doors/door-classic-001.jpg",
        "DOOR-CLASSIC-002": "/assets/doors/door-classic-002.jpg",
        "DOOR-NEO-001": "/assets/doors/door-neo-001.jpg",
        "DOOR-HIDDEN-001": "/assets/doors/door-hidden-001.jpg",
      },
      "windows": {
        "WINDOW-PVC-001": "/assets/windows/window-pvc-001.jpg",
        "WINDOW-WOOD-001": "/assets/windows/window-wood-001.jpg",
        "WINDOW-ALU-001": "/assets/windows/window-alu-001.jpg",
      },
      "furniture": {
        "FURN-KITCHEN-001": "/assets/furniture/furn-kitchen-001.jpg",
        "FURN-BEDROOM-001": "/assets/furniture/furn-bedroom-001.jpg",
        "FURN-LIVING-001": "/assets/furniture/furn-living-001.jpg",
      }
    };

    const categoryPhotos = photoMapping[category] || {};
    const photoUrl = categoryPhotos[supplierSku] || null;

    return NextResponse.json({
      category: categoryInfo,
      supplier_sku: supplierSku,
      photo_url: photoUrl,
      found: !!photoUrl,
      category_icon: categoryInfo.icon,
      category_name: categoryInfo.name
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка поиска фото" },
      { status: 500 }
    );
  }
}
