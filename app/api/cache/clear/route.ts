import { NextRequest, NextResponse } from 'next/server';
import { uniqueValuesCache } from '../../../../lib/cache/unique-values-cache';
import { logger } from '../../../../lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('Clearing unique values cache', 'cache/clear');
    
    // Очищаем кэш
    uniqueValuesCache.clear();
    
    logger.info('Unique values cache cleared successfully', 'cache/clear');
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    logger.error('Error clearing cache', 'cache/clear', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

