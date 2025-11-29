// lib/templates/render.ts
import Handlebars from 'handlebars';

/**
 * Рендер строки-шаблона Handlebars с данными.
 * Используем noEscape: true, чтобы не ломать HTML-шаблоны экспортов.
 */
export function renderTemplate<T extends object>(tpl: string, data: T): string {
  const compile = Handlebars.compile(tpl, { noEscape: true });
  return compile(data);
}

/**
 * На всякий случай — дефолт-экспорт тем же именем,
 * чтобы импорт через default тоже работал.
 */
export default renderTemplate;
