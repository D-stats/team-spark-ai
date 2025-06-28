import SwaggerParser from '@apidevtools/swagger-parser';
import { openAPISpec } from './spec';

export async function validateOpenAPISpec() {
  try {
    await SwaggerParser.validate(openAPISpec);
    console.log('API specification is valid!');
    return true;
  } catch (error) {
    console.error('API specification is invalid:', error);
    return false;
  }
}

export function createAPIResponse<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function createErrorResponse(message: string, status: number = 400, error?: string) {
  return createAPIResponse(
    {
      error: error || 'Error',
      message,
      statusCode: status,
    },
    status,
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
