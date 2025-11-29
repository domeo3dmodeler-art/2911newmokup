import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

// API для получения опубликованной страницы калькулятора дверей
export async function GET() {
  try {
    const page = {
      id: 'door-calculator-domeo',
      title: 'Калькулятор дверей Domeo - как на Framyr.ru',
      description: 'Полноценный калькулятор дверей с параметрами размеров, стиля, системы открывания и покрытия',
      url: 'door-calculator-domeo',
      isPublished: true,
      elements: [
        {
          id: '1',
          type: 'heading',
          props: {
            title: '🚪 Калькулятор дверей Domeo',
            level: 1
          },
          position: { x: 50, y: 20 },
          size: { width: 800, height: 80 },
          zIndex: 1
        },
        {
          id: '2',
          type: 'text',
          props: {
            text: 'Рассчитайте стоимость вашей двери онлайн. Выберите параметры и получите точную цену с учетом всех характеристик.'
          },
          position: { x: 50, y: 120 },
          size: { width: 800, height: 60 },
          zIndex: 2
        },
        {
          id: '3',
          type: 'doorCalculator',
          props: {
            title: 'Калькулятор дверей Domeo',
            showDimensions: true,
            showStyle: true,
            showSystem: true,
            showFinish: true
          },
          position: { x: 50, y: 200 },
          size: { width: 900, height: 800 },
          zIndex: 3
        },
        {
          id: '4',
          type: 'heading',
          props: {
            title: '📦 Наши двери',
            level: 2
          },
          position: { x: 50, y: 1020 },
          size: { width: 400, height: 60 },
          zIndex: 4
        },
        {
          id: '5',
          type: 'productGrid',
          props: {
            title: 'Популярные модели дверей',
            categoryIds: [],
            limit: 6
          },
          position: { x: 50, y: 1100 },
          size: { width: 900, height: 400 },
          zIndex: 5
        },
        {
          id: '6',
          type: 'heading',
          props: {
            title: '📞 Контакты',
            level: 2
          },
          position: { x: 50, y: 1520 },
          size: { width: 400, height: 60 },
          zIndex: 6
        },
        {
          id: '7',
          type: 'text',
          props: {
            text: 'Нужна консультация? Свяжитесь с нашими специалистами по телефону или оставьте заявку на обратный звонок.'
          },
          position: { x: 50, y: 1600 },
          size: { width: 600, height: 80 },
          zIndex: 7
        },
        {
          id: '8',
          type: 'button',
          props: {
            text: '📞 Заказать звонок',
            style: 'primary'
          },
          position: { x: 50, y: 1700 },
          size: { width: 200, height: 60 },
          zIndex: 8
        },
        {
          id: '9',
          type: 'button',
          props: {
            text: '💬 WhatsApp',
            style: 'secondary'
          },
          position: { x: 270, y: 1700 },
          size: { width: 200, height: 60 },
          zIndex: 9
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      page
    });

  } catch (error) {
    logger.error('Error fetching door calculator page', 'pages/publish-door-calculator', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

