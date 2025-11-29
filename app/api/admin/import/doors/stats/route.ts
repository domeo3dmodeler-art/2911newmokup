import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // В реальном приложении здесь был бы запрос к базе данных
    // Пока что возвращаем информацию о том, что это демо-версия
    const stats = {
      total_imports: 0, // Реальное количество импортов
      last_import: null, // Последний импорт
      import_history: [], // История импортов
      demo_mode: true, // Флаг демо-режима
      message: "Это демо-версия. Для работы с реальными данными нужна интеграция с базой данных и парсер файлов.",
      requirements: [
        "Установить библиотеку xlsx для парсинга Excel файлов",
        "Настроить подключение к базе данных (PostgreSQL/MySQL)",
        "Создать таблицы для хранения товаров и истории импортов",
        "Реализовать валидацию данных",
        "Добавить обработку ошибок"
      ]
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка получения статистики" },
      { status: 500 }
    );
  }
}
