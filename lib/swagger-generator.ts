import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

interface RouteInfo {
  path: string;
  methods: string[];
  filePath: string;
}

/**
 * Recursively scan directory for route files
 */
async function scanRoutes(dir: string, basePath: string = ''): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Handle dynamic routes like [username], [id], etc.
        let segment = entry.name;
        if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          const paramName = entry.name.slice(1, -1);
          segment = `{${paramName}}`;
        }
        
        const newBasePath = basePath ? `${basePath}/${segment}` : segment;
        const subRoutes = await scanRoutes(fullPath, newBasePath);
        routes.push(...subRoutes);
      } else if (entry.name === 'route.ts') {
        // Read the file to detect HTTP methods
        const content = await readFile(fullPath, 'utf-8');
        const methods: string[] = [];
        
        if (content.includes('export async function GET')) methods.push('get');
        if (content.includes('export async function POST')) methods.push('post');
        if (content.includes('export async function PUT')) methods.push('put');
        if (content.includes('export async function PATCH')) methods.push('patch');
        if (content.includes('export async function DELETE')) methods.push('delete');
        
        if (methods.length > 0) {
          // Normalize path - ensure it starts with / and handle empty basePath
          let normalizedPath = basePath || '';
          if (!normalizedPath.startsWith('/')) {
            normalizedPath = '/' + normalizedPath;
          }
          // Remove trailing slash if not root
          if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
            normalizedPath = normalizedPath.slice(0, -1);
          }
          
          routes.push({
            path: normalizedPath,
            methods,
            filePath: fullPath,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return routes;
}

/**
 * Generate basic OpenAPI paths from discovered routes
 */
function generatePathsFromRoutes(routes: RouteInfo[]): any {
  const paths: any = {};
  
  for (const route of routes) {
    const swaggerPath = route.path.startsWith('/') ? route.path : `/${route.path}`;
    
    if (!paths[swaggerPath]) {
      paths[swaggerPath] = {};
    }
    
    for (const method of route.methods) {
      paths[swaggerPath][method] = {
        summary: `${method.toUpperCase()} ${swaggerPath}`,
        description: `Endpoint at ${swaggerPath}`,
        tags: getTagFromPath(swaggerPath),
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '400': {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      };
      
      // Add path parameters if route has dynamic segments
      const pathParams = extractPathParams(swaggerPath);
      if (pathParams.length > 0) {
        paths[swaggerPath][method].parameters = pathParams.map(param => ({
          in: 'path',
          name: param,
          required: true,
          schema: {
            type: 'string',
          },
          description: `${param} parameter`,
        }));
      }
      
      // Add security if not health endpoint
      if (!swaggerPath.includes('/health') && !swaggerPath.includes('/swagger')) {
        paths[swaggerPath][method].security = [
          { bearerAuth: [] },
          { cookieAuth: [] },
        ];
      }
    }
  }
  
  return paths;
}

/**
 * Extract path parameters from route path
 */
function extractPathParams(path: string): string[] {
  const params: string[] = [];
  const matches = path.match(/\{(\w+)\}/g);
  if (matches) {
    for (const match of matches) {
      params.push(match.slice(1, -1));
    }
  }
  return params;
}

/**
 * Determine tag from path
 */
function getTagFromPath(path: string): string[] {
  if (path.includes('/health')) return ['Health'];
  if (path.includes('/auth')) return ['Auth'];
  if (path.includes('/desktop')) return ['Desktop'];
  if (path.includes('/admin')) return ['Admin'];
  if (path.includes('/web')) return ['Web'];
  if (path.includes('/users')) return ['Users'];
  return ['API'];
}

/**
 * Generate complete Swagger spec
 */
export async function generateSwaggerSpec(): Promise<any> {
  // Use absolute path resolution for Next.js
  const apiDir = join(process.cwd(), 'app', 'api');
  
  // Check if directory exists
  try {
    await stat(apiDir);
  } catch (error) {
    console.error('API directory not found:', apiDir);
    // Fallback to JSDoc only
    return getJSDocSpec();
  }
  
  // Scan for routes
  let routes: RouteInfo[] = [];
  let autoPaths: any = {};
  
  try {
    routes = await scanRoutes(apiDir);
    autoPaths = generatePathsFromRoutes(routes);
    console.log(`Discovered ${routes.length} routes automatically`);
  } catch (error) {
    console.warn('Error scanning routes, using JSDoc only:', error);
  }
  
  // Get paths from JSDoc comments
  const jsdocOptions: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Brilworks Time Logger API',
        version: '1.0.0',
        description: 'API documentation for Brilworks Time Logger application',
      },
    },
    apis: ['./app/api/**/*.ts'],
  };
  
  let jsdocSpec: any = { paths: {} };
  try {
    jsdocSpec = swaggerJsdoc(jsdocOptions);
  } catch (error) {
    console.warn('Error generating JSDoc spec:', error);
  }
  
  // Merge auto-discovered paths with JSDoc paths (JSDoc takes precedence)
  const mergedPaths = {
    ...autoPaths,
    ...(jsdocSpec.paths || {}),
  };
  
  // Build complete spec
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'Brilworks Time Logger API',
      version: '1.0.0',
      description: 'API documentation for Brilworks Time Logger application',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Base URL',
      },
    ],
    paths: mergedPaths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Authentication token stored in httpOnly cookie',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            projectId: {
              type: 'string',
              format: 'uuid',
            },
            isActive: {
              type: 'boolean',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              nullable: true,
            },
            role: {
              type: 'string',
              enum: ['user', 'ROLE_ADMIN'],
            },
            accountNonLocked: {
              type: 'boolean',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Desktop',
        description: 'Desktop client API endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin API endpoints',
      },
      {
        name: 'Web',
        description: 'Web API endpoints',
      },
      {
        name: 'Users',
        description: 'User API endpoints',
      },
      {
        name: 'API',
        description: 'General API endpoints',
      },
    ],
  };
  
  return spec;
}

/**
 * Fallback to JSDoc-only spec if file scanning fails
 */
function getJSDocSpec(): any {
  const jsdocOptions: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Brilworks Time Logger API',
        version: '1.0.0',
        description: 'API documentation for Brilworks Time Logger application',
        contact: {
          name: 'API Support',
        },
      },
      servers: [
        {
          url: '/api',
          description: 'API Base URL',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter JWT token',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'token',
            description: 'Authentication token stored in httpOnly cookie',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Error message',
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'Health',
          description: 'Health check endpoints',
        },
        {
          name: 'Auth',
          description: 'Authentication endpoints',
        },
        {
          name: 'Desktop',
          description: 'Desktop client API endpoints',
        },
        {
          name: 'Admin',
          description: 'Admin API endpoints',
        },
        {
          name: 'Web',
          description: 'Web API endpoints',
        },
      ],
    },
    apis: ['./app/api/**/*.ts'],
  };
  
  return swaggerJsdoc(jsdocOptions);
}

