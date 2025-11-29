import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

export async function GET() {
  try {
    // Загружаем тестовую страницу из файла
    const fs = require('fs');
    const path = require('path');
    
    const testPagePath = path.join(process.cwd(), 'app', 'test-connections-page.json');
    const testPageData = JSON.parse(fs.readFileSync(testPagePath, 'utf8'));
    
    return NextResponse.json({
      success: true,
      page: testPageData
    });
  } catch (error) {
    logger.error('Error loading test page', 'pages/test-connections', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to load test page' },
      { status: 500 }
    );
  }
}

