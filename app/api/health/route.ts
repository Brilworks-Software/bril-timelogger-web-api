import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and database connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: brilworks-api
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 checks:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: string
 *                       example: ok
 *                     database:
 *                       type: string
 *                       example: ok
 *       503:
 *         description: Service is degraded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

