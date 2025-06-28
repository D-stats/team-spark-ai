import SwaggerParser from '@apidevtools/swagger-parser';
import { NextResponse } from 'next/server';
import { openAPISpec } from './spec';
import { log, logError } from '@/lib/logger';

export async function validateOpenAPISpec() {
  try {
    await SwaggerParser.validate(openAPISpec);
    log.info('API specification is valid!');
    return true;
  } catch (error) {
    logError(error as Error, 'validateOpenAPISpec - API specification is invalid');
    return false;
  }
}

export function createAPIResponse<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {},
) {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return response;
}

export function createErrorResponse(message: string, status: number = 400, error?: string) {
  return NextResponse.json(
    {
      error: error || 'Error',
      message,
      statusCode: status,
    },
    { status }
  );
}

export function createPaginatedResponse<T>(items: T[], page: number, limit: number, total: number) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
