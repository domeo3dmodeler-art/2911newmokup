import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Domeo Doors Platform
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            NoCode платформа конфигураторов для дверей
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link 
            href="/dashboard" 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Панель управления</h2>
            <p className="text-gray-600">Административная панель для управления системой</p>
          </Link>

          <Link 
            href="/constructor" 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Конструктор</h2>
            <p className="text-gray-600">Создание и настройка конфигураторов</p>
          </Link>

          <Link 
            href="/catalog" 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Каталог</h2>
            <p className="text-gray-600">Просмотр товаров и категорий</p>
          </Link>

          <Link 
            href="/kalkulyator-dverey" 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Калькулятор дверей</h2>
            <p className="text-gray-600">Расчет стоимости дверей</p>
          </Link>

          <Link 
            href="/page-builder" 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Конструктор страниц</h2>
            <p className="text-gray-600">Создание страниц без кода</p>
          </Link>

          <Link 
            href="/professional-builder" 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Профессиональный конструктор</h2>
            <p className="text-gray-600">Расширенные возможности конструирования</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
