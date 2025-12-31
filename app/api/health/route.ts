import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'brilworks-api',
      version: '1.0.0',
      checks: {
        api: 'ok',
        database: 'unknown',
      },
    };

    // Check database connectivity
    try {
      const supabase = createServerClient();
      // Simple query to check database connection
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        healthStatus.checks.database = 'error';
        healthStatus.status = 'degraded';
        return NextResponse.json(healthStatus, { status: 503 });
      }

      healthStatus.checks.database = 'ok';
    } catch (dbError) {
      healthStatus.checks.database = 'error';
      healthStatus.status = 'degraded';
      return NextResponse.json(healthStatus, { status: 503 });
    }

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'brilworks-api',
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}

