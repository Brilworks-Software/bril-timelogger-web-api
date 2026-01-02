import { NextResponse } from 'next/server';
import { generateSwaggerSpec } from '@/lib/swagger-generator';

// GET /api/swagger - Get Swagger/OpenAPI specification
export async function GET() {
  try {
    const spec = await generateSwaggerSpec();
    return NextResponse.json(spec);
  } catch (error) {
    console.error('Error generating Swagger spec:', error);
    return NextResponse.json(
      { message: 'Error generating API documentation', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

