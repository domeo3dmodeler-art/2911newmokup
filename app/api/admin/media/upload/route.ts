import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const model = formData.get("model") as string;
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Файлы не предоставлены" },
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

    // В реальном приложении здесь была бы загрузка файлов на сервер
    // и сохранение связи с товаром по артикулу поставщика
    const uploadedFiles = files.map(file => {
      // Генерируем имя файла на основе артикула поставщика
      const supplierSku = model || "unknown";
      const fileName = `${supplierSku}.${file.name.split('.').pop()}`;
      
      return {
        filename: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: `/assets/doors/${fileName}`,
        supplier_sku: supplierSku,
        model: model || "unknown"
      };
    });

    return NextResponse.json({
      message: "Файлы успешно загружены",
      files: uploadedFiles,
      photo_mapping: {
        // Создаем маппинг артикул поставщика -> URL фото
        [model || "unknown"]: uploadedFiles[0]?.url
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка загрузки файлов" },
      { status: 500 }
    );
  }
}
