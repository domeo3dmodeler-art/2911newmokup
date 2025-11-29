// app/api/upload/route.ts
// API для загрузки файлов в Yandex Object Storage
// Поддерживает множественную загрузку и оптимизацию изображений

import { NextRequest, NextResponse } from 'next/server';
import { storageService, FileType, FileUtils } from '../../../lib/storage/yandex-storage';
import { logger } from '../../../lib/logging/logger';

// Максимальный размер файла (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Разрешенные типы файлов
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const fileType = formData.get('fileType') as string || FileType.PRODUCT_IMAGE;
    const generateThumbnail = formData.get('generateThumbnail') === 'true';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Валидация файлов
    for (const file of files) {
      if (!FileUtils.isValidFileSize(file.size, 10)) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} is too large. Maximum size is 10MB.` },
          { status: 400 }
        );
      }

      if (fileType === FileType.PRODUCT_IMAGE && !FileUtils.isValidImageType(file.type)) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} is not a valid image type.` },
          { status: 400 }
        );
      }
    }

    const uploadResults = [];

    // Обработка каждого файла
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      let result;
      
      if (fileType === FileType.PRODUCT_IMAGE) {
        // Обработка изображений с оптимизацией
        result = await storageService.uploadImage(
          buffer,
          file.name,
          fileType as FileType,
          {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85,
            format: 'jpeg',
            generateThumbnail,
          }
        );
      } else {
        // Обработка обычных файлов
        result = await storageService.uploadFile(
          buffer,
          file.name,
          fileType as FileType,
          {
            contentType: file.type,
          }
        );
      }

      uploadResults.push({
        originalName: file.name,
        filename: result.filename,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        size: result.size,
        mimeType: result.mimeType,
        width: result.width,
        height: result.height,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadResults,
      message: `Successfully uploaded ${files.length} file(s)`,
    });

  } catch (error) {
    logger.error('Upload error', 'upload', error instanceof Error ? { error: error.message, stack: error.stack, fileType, filesCount: files?.length } : { error: String(error), fileType, filesCount: files?.length });
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// DELETE endpoint для удаления файлов
export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      );
    }

    await storageService.deleteFile(filename);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    logger.error('Delete error', 'upload', error instanceof Error ? { error: error.message, stack: error.stack, filename } : { error: String(error), filename });
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения подписанной URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      );
    }

    const signedUrl = await storageService.getSignedUrl(filename, expiresIn);

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn,
    });

  } catch (error) {
    logger.error('Get signed URL error', 'upload', error instanceof Error ? { error: error.message, stack: error.stack, filename, expiresIn } : { error: String(error), filename, expiresIn });
    return NextResponse.json(
      { success: false, error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
