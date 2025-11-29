import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ 
      success: true, 
      message: 'Price list export API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in test endpoint', 'admin/export/test', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Test failed' },
      { status: 500 }
    );
  }
}
