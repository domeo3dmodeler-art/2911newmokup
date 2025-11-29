import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import {
  CatalogCategory,
  ProductProperty,
  CategoryPropertyAssignment,
  ImportTemplate,
  ExportSetting,
  FrontendCategory,
  CreateCatalogCategoryDto,
  UpdateCatalogCategoryDto,
  CreateProductPropertyDto,
  UpdateProductPropertyDto,
  CreatePropertyAssignmentDto,
  UpdatePropertyAssignmentDto,
  CreateImportTemplateDto,
  CreateExportSettingDto,
  CreateFrontendCategoryDto,
  CatalogTreeResponse,
  PropertyModerationResponse,
  CategoryWithPropertiesResponse,
  ExportFieldConfig,
  ExportDisplayConfig,
  FrontendDisplayConfig
} from '../types/catalog';

export class CatalogService {
  // ===========================================
  // КАТАЛОГ КАТЕГОРИЙ
  // ===========================================

  async getCatalogTree(): Promise<CatalogTreeResponse> {
    const categories = await prisma.catalogCategory.findMany({
      where: { is_active: true },
      orderBy: [
        { level: 'asc' },
        { sort_order: 'asc' },
        { name: 'asc' }
      ]
    });

    // Подсчитываем товары для каждой категории (прямые + из всех подкатегорий)
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category: CatalogCategory) => {
        // Считаем прямые товары в категории
        const directProductsCount = await prisma.product.count({
          where: {
            catalog_category_id: category.id
          }
        });
        
        // Считаем товары во всех подкатегориях рекурсивно
        const getAllSubcategoryIds = async (categoryId: string): Promise<string[]> => {
          const subcategories = await prisma.catalogCategory.findMany({
            where: {
              parent_id: categoryId,
              is_active: true
            },
            select: { id: true }
          });
          
          let allIds = subcategories.map((sub: { id: string }) => sub.id);
          
          // Рекурсивно получаем ID всех вложенных подкатегорий
          for (const sub of subcategories) {
            const nestedIds = await getAllSubcategoryIds(sub.id);
            allIds = [...allIds, ...nestedIds];
          }
          
          return allIds;
        };
        
        const subcategoryIds = await getAllSubcategoryIds(category.id);
        
        // Считаем товары во всех подкатегориях
        const subcategoryProductsCount = subcategoryIds.length > 0 
          ? await prisma.product.count({
              where: {
                catalog_category_id: { in: subcategoryIds }
              }
            })
          : 0;
        
        // Общее количество товаров = прямые + из подкатегорий
        const totalProductsCount = directProductsCount + subcategoryProductsCount;
        
        return {
          ...category,
          name: category.name, // Явно сохраняем UTF-8
          products_count: totalProductsCount,
          direct_products_count: directProductsCount,
          subcategory_products_count: subcategoryProductsCount
        };
      })
    );

    // Строим иерархическое дерево
    type CategoryNode = CatalogCategory & { subcategories: CategoryNode[] };
    const categoryMap = new Map<string, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    // Сначала создаем карту всех категорий
    categoriesWithCounts.forEach((category: CatalogCategory & { products_count?: number; direct_products_count?: number; subcategory_products_count?: number }) => {
      categoryMap.set(category.id, {
        ...category,
        subcategories: []
      } as CategoryNode);
    });

    // Затем строим иерархию
    categoriesWithCounts.forEach((category: CatalogCategory & { products_count?: number; direct_products_count?: number; subcategory_products_count?: number }) => {
      const categoryNode = categoryMap.get(category.id);
      
      if (categoryNode && category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.subcategories.push(categoryNode);
        }
      } else if (categoryNode) {
        rootCategories.push(categoryNode);
      }
    });

    // Функция для суммирования товаров в подкатегориях
    const calculateTotalProducts = (category: CategoryNode): number => {
      let total = (category as CategoryNode & { direct_products_count?: number }).direct_products_count || 0; // Только прямые товары
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach((subcategory: CategoryNode) => {
          total += calculateTotalProducts(subcategory);
        });
      }
      return total;
    };

    // Обновляем счетчики товаров с учетом подкатегорий
    const updateCategoryCounts = (category: CategoryNode) => {
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(updateCategoryCounts);
        // Общее количество = прямые товары + товары из всех подкатегорий
        category.products_count = calculateTotalProducts(category);
      }
      // Для листовых категорий products_count уже правильно установлен
    };

    rootCategories.forEach(updateCategoryCounts);

    return {
      categories: rootCategories,
      total_count: categories.length
    };
  }

  async getCategoryById(id: string): Promise<CategoryWithPropertiesResponse | null> {
    const category = await prisma.catalogCategory.findUnique({
      where: { id },
      include: {
        property_assignments: {
          include: {
            product_property: true
          },
          orderBy: { sort_order: 'asc' }
        },
        import_templates: true,
        export_settings: true,
        subcategories: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' }
        },
        parent: true,
      }
    });

    if (!category) return null;

    return {
      ...category,
      products_count: category.products_count || 0
    };
  }

  async createCategory(data: CreateCatalogCategoryDto): Promise<CatalogCategory> {
    // Определяем уровень и путь
    let level = 0;
    let path = '';
    
    if (data.parent_id) {
      const parent = await prisma.catalogCategory.findUnique({
        where: { id: data.parent_id }
      });
      
      if (parent) {
        level = parent.level + 1;
        path = parent.path ? `${parent.path}/${parent.id}` : parent.id;
      }
    }

    const category = await prisma.catalogCategory.create({
      data: {
        ...data,
        level,
        path,
        sort_order: data.sort_order || 0
      }
    });

    return category;
  }

  async updateCategory(id: string, data: UpdateCatalogCategoryDto): Promise<CatalogCategory> {
    // Если меняется родитель, нужно пересчитать уровень и путь
    if (data.parent_id !== undefined) {
      let level = 0;
      let path = '';
      
      if (data.parent_id) {
        const parent = await prisma.catalogCategory.findUnique({
          where: { id: data.parent_id }
        });
        
        if (parent) {
          level = parent.level + 1;
          path = parent.path ? `${parent.path}/${parent.id}` : parent.id;
        }
      }

      return prisma.catalogCategory.update({
        where: { id },
        data: {
          ...data,
          level,
          path
        }
      });
    }

    return prisma.catalogCategory.update({
      where: { id },
      data
    });
  }

  async deleteCategory(id: string): Promise<void> {
    // Проверяем, есть ли подкатегории или товары
    const category = await prisma.catalogCategory.findUnique({
      where: { id },
      include: {
        subcategories: true,
        products: true
      }
    });

    if (!category) {
      throw new Error('Категория не найдена');
    }

    if (category.subcategories.length > 0) {
      throw new Error('Нельзя удалить категорию с подкатегориями');
    }

    if (category.products.length > 0) {
      throw new Error('Нельзя удалить категорию с товарами');
    }

    await prisma.catalogCategory.delete({
      where: { id }
    });
  }

  // ===========================================
  // СВОЙСТВА ТОВАРОВ
  // ===========================================

  async getPropertiesForModeration(): Promise<PropertyModerationResponse> {
    const properties = await prisma.productProperty.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        category_assignments: {
          include: {
            catalog_category: true
          }
        }
      }
    });

    const pendingCount = properties.filter((p: ProductProperty & { category_assignments?: unknown[] }) => 
      !p.category_assignments || p.category_assignments.length === 0
    ).length;

    return {
      properties,
      pending_count: pendingCount,
      total_count: properties.length
    };
  }

  async createProperty(data: CreateProductPropertyDto): Promise<ProductProperty> {
    return prisma.productProperty.create({
      data: {
        ...data,
        options: data.options ? JSON.stringify(data.options) : null
      }
    });
  }

  async updateProperty(id: string, data: UpdateProductPropertyDto): Promise<ProductProperty> {
    return prisma.productProperty.update({
      where: { id },
      data: {
        ...data,
        options: data.options ? JSON.stringify(data.options) : undefined
      }
    });
  }

  async deleteProperty(id: string): Promise<void> {
    // Проверяем, используется ли свойство
    const assignments = await prisma.categoryPropertyAssignment.findMany({
      where: { product_property_id: id }
    });

    if (assignments.length > 0) {
      throw new Error('Нельзя удалить свойство, которое используется в категориях');
    }

    await prisma.productProperty.delete({
      where: { id }
    });
  }

  // ===========================================
  // НАЗНАЧЕНИЕ СВОЙСТВ КАТЕГОРИЯМ
  // ===========================================

  async assignPropertyToCategory(data: CreatePropertyAssignmentDto): Promise<CategoryPropertyAssignment> {
    // Проверяем, не назначено ли уже это свойство этой категории
    const existing = await prisma.categoryPropertyAssignment.findUnique({
      where: {
        catalog_category_id_product_property_id: {
          catalog_category_id: data.catalog_category_id,
          product_property_id: data.product_property_id
        }
      }
    });

    if (existing) {
      throw new Error('Свойство уже назначено этой категории');
    }

    return prisma.categoryPropertyAssignment.create({
      data,
      include: {
        product_property: true,
        catalog_category: true
      }
    });
  }

  async updatePropertyAssignment(id: string, data: UpdatePropertyAssignmentDto): Promise<CategoryPropertyAssignment> {
    return prisma.categoryPropertyAssignment.update({
      where: { id },
      data,
      include: {
        product_property: true,
        catalog_category: true
      }
    });
  }

  async removePropertyAssignment(id: string): Promise<void> {
    await prisma.categoryPropertyAssignment.delete({
      where: { id }
    });
  }

  // ===========================================
  // ШАБЛОНЫ ИМПОРТА
  // ===========================================

  async createImportTemplate(data: CreateImportTemplateDto): Promise<ImportTemplate> {
    return prisma.importTemplate.create({
      data: {
        ...data,
        required_fields: JSON.stringify(data.required_fields),
        calculator_fields: JSON.stringify(data.calculator_fields),
        export_fields: JSON.stringify(data.export_fields)
      }
    });
  }

  async getImportTemplatesByCategory(categoryId: string): Promise<ImportTemplate[]> {
    const templates = await prisma.importTemplate.findMany({
      where: { catalog_category_id: categoryId },
      orderBy: { created_at: 'desc' }
    });

    return templates.map((template: ImportTemplate & { required_fields: string; calculator_fields: string; export_fields: string }) => ({
      ...template,
      required_fields: JSON.parse(template.required_fields) as string[],
      calculator_fields: JSON.parse(template.calculator_fields) as string[],
      export_fields: JSON.parse(template.export_fields) as string[]
    }));
  }

  // ===========================================
  // НАСТРОЙКИ ЭКСПОРТА
  // ===========================================

  async createExportSetting(data: CreateExportSettingDto): Promise<ExportSetting> {
    return prisma.exportSetting.create({
      data: {
        ...data,
        fields_config: JSON.stringify(data.fields_config),
        display_config: JSON.stringify(data.display_config)
      }
    });
  }

  async getExportSettingsByCategory(categoryId: string): Promise<ExportSetting[]> {
    const settings = await prisma.exportSetting.findMany({
      where: { catalog_category_id: categoryId },
      orderBy: { export_type: 'asc' }
    });

    return settings.map((setting: ExportSetting & { fields_config: string; display_config: string }) => ({
      ...setting,
      fields_config: JSON.parse(setting.fields_config) as ExportFieldConfig[],
      display_config: JSON.parse(setting.display_config) as ExportDisplayConfig
    }));
  }

  // ===========================================
  // КАТЕГОРИИ ФРОНТА
  // ===========================================

  async getFrontendCategories(): Promise<FrontendCategory[]> {
    const categories = await prisma.frontendCategory.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });

    return categories.map((category: FrontendCategory & { catalog_category_ids: string; display_config: string }) => ({
      ...category,
      catalog_category_ids: JSON.parse(category.catalog_category_ids) as string[],
      display_config: JSON.parse(category.display_config) as FrontendDisplayConfig
    }));
  }

  async getFrontendCategoryById(id: string): Promise<FrontendCategory | null> {
    const category = await prisma.frontendCategory.findUnique({
      where: { id }
    });

    if (!category) return null;

    return {
      ...category,
      catalog_category_ids: JSON.parse(category.catalog_category_ids),
      display_config: JSON.parse(category.display_config)
    };
  }

  async getFrontendCategoryBySlug(slug: string): Promise<FrontendCategory | null> {
    const category = await prisma.frontendCategory.findUnique({
      where: { slug }
    });

    if (!category) return null;

    return {
      ...category,
      catalog_category_ids: JSON.parse(category.catalog_category_ids),
      display_config: JSON.parse(category.display_config)
    };
  }

  async createFrontendCategory(data: CreateFrontendCategoryDto): Promise<FrontendCategory> {
    const category = await prisma.frontendCategory.create({
      data: {
        ...data,
        catalog_category_ids: JSON.stringify(data.catalog_category_ids),
        display_config: JSON.stringify(data.display_config || {})
      }
    });

    return {
      ...category,
      catalog_category_ids: JSON.parse(category.catalog_category_ids),
      display_config: JSON.parse(category.display_config)
    };
  }

  async updateFrontendCategory(id: string, data: Partial<CreateFrontendCategoryDto>): Promise<FrontendCategory> {
    const updateData: Record<string, unknown> = { ...data };
    
    if (data.catalog_category_ids) {
      updateData.catalog_category_ids = JSON.stringify(data.catalog_category_ids);
    }
    
    if (data.display_config) {
      updateData.display_config = JSON.stringify(data.display_config);
    }

    const category = await prisma.frontendCategory.update({
      where: { id },
      data: updateData
    });

    return {
      ...category,
      catalog_category_ids: JSON.parse(category.catalog_category_ids),
      display_config: JSON.parse(category.display_config)
    };
  }

  async deleteFrontendCategory(id: string): Promise<void> {
    // Проверяем, используется ли категория
    // Здесь можно добавить проверки на связанные данные
    
    await prisma.frontendCategory.delete({
      where: { id }
    });
  }

  // ===========================================
  // ТОВАРЫ
  // ===========================================

  async getProducts(params: {
    catalogCategoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    products: Array<{
      id: string;
      sku: string;
      name: string;
      catalog_category_id: string;
      properties_data: Record<string, unknown>;
      base_price: number;
      currency: string;
      stock_quantity: number;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
      catalog_category: {
        id: string;
        name: string;
        level: number;
        path: string;
      };
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      catalogCategoryId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = params;

    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: any = {};

    if (catalogCategoryId) {
      where.catalog_category_id = catalogCategoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Получаем товары
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          catalog_category: {
            select: {
              id: true,
              name: true,
              level: true,
              path: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    const processedProducts = products.map((product: { properties_data: string; [key: string]: unknown }) => ({
      ...product,
      properties_data: JSON.parse(product.properties_data)
    }));

    return {
      products: processedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getProductById(id: string): Promise<{
    id: string;
    sku: string;
    name: string;
    catalog_category_id: string;
    properties_data: Record<string, any>;
    base_price: number;
    currency: string;
    stock_quantity: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    catalog_category: {
      id: string;
      name: string;
      level: number;
      path: string;
    };
  } | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        catalog_category: {
          select: {
            id: true,
            name: true,
            level: true,
            path: true
          }
        }
      }
    });

    if (!product) return null;

    return {
      ...product,
      properties_data: JSON.parse(product.properties_data)
    };
  }

  async getProductBySku(sku: string): Promise<{
    id: string;
    sku: string;
    name: string;
    catalog_category_id: string;
    properties_data: Record<string, any>;
    base_price: number;
    currency: string;
    stock_quantity: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  } | null> {
    const product = await prisma.product.findUnique({
      where: { sku }
    });

    if (!product) return null;

    return {
      ...product,
      properties_data: JSON.parse(product.properties_data)
    };
  }

  async createProduct(data: {
    sku: string;
    name: string;
    catalog_category_id: string;
    properties_data?: Record<string, any>;
    base_price?: number;
    currency?: string;
    stock_quantity?: number;
    is_active?: boolean;
  }): Promise<{
    id: string;
    sku: string;
    name: string;
    catalog_category_id: string;
    properties_data: Record<string, any>;
    base_price: number;
    currency: string;
    stock_quantity: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }> {
    const product = await prisma.product.create({
      data: {
        ...data,
        properties_data: JSON.stringify(data.properties_data || {}),
        base_price: data.base_price || 0,
        currency: data.currency || 'RUB',
        stock_quantity: data.stock_quantity || 0,
        is_active: data.is_active !== undefined ? data.is_active : true
      }
    });

    return {
      ...product,
      properties_data: JSON.parse(product.properties_data)
    };
  }

  async updateProduct(id: string, data: Partial<{
    sku: string;
    name: string;
    catalog_category_id: string;
    properties_data: Record<string, any>;
    base_price: number;
    currency: string;
    stock_quantity: number;
    is_active: boolean;
  }>): Promise<{
    id: string;
    sku: string;
    name: string;
    catalog_category_id: string;
    properties_data: Record<string, any>;
    base_price: number;
    currency: string;
    stock_quantity: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }> {
    const updateData: Record<string, unknown> = { ...data };
    
    if (data.properties_data) {
      updateData.properties_data = JSON.stringify(data.properties_data);
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    return {
      ...product,
      properties_data: JSON.parse(product.properties_data)
    };
  }

  async deleteProduct(id: string): Promise<void> {
    // Проверяем, используется ли товар в заказах
    // Здесь можно добавить проверки на связанные данные
    
    await prisma.product.delete({
      where: { id }
    });
  }

  // ===========================================
  // ПОИСК И ФИЛЬТРАЦИЯ
  // ===========================================

  async searchCategories(query: string): Promise<CatalogCategory[]> {
    return prisma.catalogCategory.findMany({
      where: {
        is_active: true,
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: { name: 'asc' },
      take: 20
    });
  }

  async getCategoriesByLevel(level: number): Promise<CatalogCategory[]> {
    return prisma.catalogCategory.findMany({
      where: {
        level,
        is_active: true
      },
      orderBy: { sort_order: 'asc' }
    });
  }
}

export const catalogService = new CatalogService();
