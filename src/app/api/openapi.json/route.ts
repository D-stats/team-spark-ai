import { NextResponse } from 'next/server';
import { openAPISpec } from '@/lib/openapi/spec';

export async function GET() {
  return NextResponse.json(openAPISpec);
}
