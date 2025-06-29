import { OpenAPIV3 } from 'openapi-types';

export const openAPISpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'TeamSpark AI API',
    version: '1.0.0',
    description: 'AI-powered team communication and engagement platform API',
    contact: {
      name: 'TeamSpark AI Support',
      email: 'support@teamspark.ai',
    },
  },
  servers: [
    {
      url: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
      description: 'Current environment',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'Users',
      description: 'User management',
    },
    {
      name: 'Teams',
      description: 'Team management',
    },
    {
      name: 'Kudos',
      description: 'Kudos system',
    },
    {
      name: 'Check-ins',
      description: 'Team check-ins',
    },
    {
      name: 'Health',
      description: 'System health checks',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Returns the health status of the application',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User login',
        description: 'Authenticate user with email and password',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Get a list of users in the organization',
        operationId: 'listUsers',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20,
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UsersListResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/kudos': {
      get: {
        tags: ['Kudos'],
        summary: 'List kudos',
        description: 'Get a list of kudos',
        operationId: 'listKudos',
        parameters: [
          {
            name: 'receiverId',
            in: 'query',
            description: 'Filter by receiver ID',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'giverId',
            in: 'query',
            description: 'Filter by giver ID',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of kudos',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/KudosListResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Kudos'],
        summary: 'Create kudos',
        description: 'Give kudos to a team member',
        operationId: 'createKudos',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateKudosRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Kudos created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Kudos',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'error'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          service: {
            type: 'string',
          },
          version: {
            type: 'string',
          },
          checks: {
            type: 'object',
            properties: {
              server: {
                type: 'boolean',
              },
              database: {
                type: 'boolean',
              },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
            minLength: 8,
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          name: {
            type: 'string',
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'MANAGER', 'MEMBER'],
          },
          organizationId: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      UsersListResponse: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User',
            },
          },
          pagination: {
            $ref: '#/components/schemas/Pagination',
          },
        },
      },
      Kudos: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
          points: {
            type: 'integer',
          },
          categoryId: {
            type: 'string',
          },
          giverId: {
            type: 'string',
          },
          receiverId: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateKudosRequest: {
        type: 'object',
        required: ['receiverId', 'message', 'categoryId'],
        properties: {
          receiverId: {
            type: 'string',
          },
          message: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
          },
          categoryId: {
            type: 'string',
          },
          points: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      },
      KudosListResponse: {
        type: 'object',
        properties: {
          kudos: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Kudos',
            },
          },
          pagination: {
            $ref: '#/components/schemas/Pagination',
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
          },
          limit: {
            type: 'integer',
          },
          total: {
            type: 'integer',
          },
          totalPages: {
            type: 'integer',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
          statusCode: {
            type: 'integer',
          },
        },
      },
    },
  },
};
