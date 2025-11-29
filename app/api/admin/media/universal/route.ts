import { NextRequest, NextResponse } from "next/server";

// Универсальная загрузка фото для любой категории товаров
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const category = formData.get("category") as string;
    const supplierSku = formData.get("supplier_sku") as string;
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Файлы не предоставлены" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Категория не указана" },
        { status: 400 }
      );
    }

    if (!supplierSku) {
      return NextResponse.json(
        { error: "Артикул поставщика не указан" },
        { status: 400 }
      );
    }

    // Простая валидация файлов
    const allowedTypes = [
      "image/jpeg",
      "image/png", 
      "image/webp"
    ];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Неподдерживаемый тип файла: ${file.name}. Разрешены: JPEG, PNG, WebP` },
          { status: 400 }
        );
      }
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

    // В реальном приложении здесь была бы загрузка файлов на сервер
    // и сохранение связи с товаром по артикулу поставщика
    const uploadedFiles = files.map(file => {
      // Генерируем имя файла на основе категории и артикула поставщика
      const fileName = `${category}_${supplierSku}_${Date.now()}.${file.name.split('.').pop()}`;
      
      return {
        filename: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: `/assets/${category}/${fileName}`,
        supplier_sku: supplierSku,
        category: category
      };
    });

    return NextResponse.json({
      message: "Файлы успешно загружены",
      category: categoryInfo,
      files: uploadedFiles,
      photo_mapping: {
        // Создаем маппинг артикул поставщика -> URL фото
        [supplierSku]: uploadedFiles[0]?.url
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка загрузки файлов" },
      { status: 500 }
    );
  }
}
