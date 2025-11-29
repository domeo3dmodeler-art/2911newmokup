import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Для демо отключаем проверку авторизации
    // const authHeader = req.headers.get("authorization");
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   return NextResponse.json(
    //     { error: "Требуется авторизация" },
    //     { status: 401 }
    //   );
    // }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mapping = formData.get("mapping") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не предоставлен" },
        { status: 400 }
      );
    }

    // Простая валидация файла
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "text/csv", // .csv
      "application/vnd.ms-excel" // .xls
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Неподдерживаемый тип файла. Разрешены: .xlsx, .csv, .xls" },
        { status: 400 }
      );
    }

    // Читаем содержимое файла
    const fileContent = await file.text();
    
    // Парсим mapping если предоставлен
    let mappingConfig = null;
    if (mapping) {
      try {
        mappingConfig = JSON.parse(mapping);
      } catch (e) {
        return NextResponse.json(
          { error: "Неверный формат mapping JSON" },
          { status: 400 }
        );
      }
    }

    // В реальном приложении здесь была бы обработка файла с библиотекой xlsx
    // Пока что возвращаем информацию о загруженном файле
    const result = {
      message: "Файл успешно обработан",
      filename: file.name,
      size: file.size,
      type: file.type,
      mapping: mappingConfig,
      imported: 0, // Будет заполнено после реальной обработки
      errors: [],
      products: [], // Будет заполнено после реальной обработки
      photo_mapping: {}, // Будет заполнено после реальной обработки
      file_content_preview: fileContent.substring(0, 500), // Показываем первые 500 символов
      processing_status: "pending", // Статус обработки
      note: "Это демо-версия. В реальном приложении здесь была бы полная обработка файла с библиотекой xlsx/csv-parser"
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка обработки файла" },
      { status: 500 }
    );
  }
}
