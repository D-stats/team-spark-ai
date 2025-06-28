import { NextResponse } from 'next/server';
import { openAPISpec } from '@/lib/openapi/spec';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(openAPISpec);
}
