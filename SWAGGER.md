# Swagger API Documentation

This project includes Swagger/OpenAPI documentation for all API endpoints.

## Accessing Swagger UI

Once the application is running, you can access the Swagger UI at:

**URL:** `http://localhost:3000/api/swagger-ui`

This will display an interactive API documentation interface where you can:
- Browse all available endpoints (automatically discovered)
- See request/response schemas
- Test API endpoints directly from the browser
- View authentication requirements

## Auto-Discovery

The Swagger documentation automatically discovers all API routes by scanning the `app/api` directory structure. This means:

- **All routes are automatically included** - You don't need to manually register each endpoint
- **Route paths are inferred** - Dynamic routes like `[username]` are converted to `{username}` in Swagger
- **HTTP methods are detected** - GET, POST, PUT, DELETE, PATCH are automatically detected from route handlers
- **Basic documentation is generated** - Each route gets a basic summary and standard response codes

You can enhance the auto-generated documentation by adding JSDoc comments with `@swagger` annotations to your route files.

## API Specification

The OpenAPI specification (JSON) is available at:

**URL:** `http://localhost:3000/api/swagger`

This returns the raw OpenAPI 3.0 specification in JSON format, which can be imported into other tools like Postman, Insomnia, or API testing frameworks.

## Adding Documentation to New Endpoints

To document a new API endpoint, add JSDoc comments with Swagger annotations above the route handler function.

### Example:

```typescript
/**
 * @swagger
 * /desktop/{username}/my-projects-tasks:
 *   get:
 *     summary: Get all active projects and tasks assigned to a user
 *     description: Returns all active projects assigned to the user along with their related active tasks
 *     tags: [Desktop]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user
 *     responses:
 *       200:
 *         description: List of projects with their tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  // Your route handler code
}
```

## Available Tags

- `Health` - Health check endpoints
- `Auth` - Authentication endpoints
- `Desktop` - Desktop client API endpoints
- `Admin` - Admin API endpoints
- `Web` - Web API endpoints

## Common Schemas

The following schemas are available for reuse in documentation:

- `Error` - Standard error response
- `Project` - Project object
- `Task` - Task object
- `User` - User object

Use `$ref: '#/components/schemas/SchemaName'` to reference them.

## Security

The API supports two authentication methods:

1. **Bearer Token** (`bearerAuth`) - JWT token in Authorization header
2. **Cookie Auth** (`cookieAuth`) - Token stored in httpOnly cookie

Both are configured in the Swagger UI and can be tested directly from the interface.

## Notes

- All endpoints are automatically scanned from `app/api/**/*.ts`
- The Swagger spec is generated at runtime
- Make sure to include proper JSDoc comments for all endpoints you want documented
- Use appropriate HTTP status codes in your responses documentation

