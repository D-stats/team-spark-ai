export const securityConfig = {
  // Rate limiting
  rateLimit: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 auth requests per windowMs
    },
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Limit each IP to 10 uploads per hour
    },
  },

  // CORS
  cors: {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Session
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // JWT
  jwt: {
    expiresIn: '7d',
    algorithm: 'HS256' as const,
  },

  // Input validation
  validation: {
    maxEmailLength: 255,
    maxNameLength: 100,
    maxMessageLength: 1000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // Security headers
  headers: {
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://api.slack.com', 'wss://wss-primary.slack.com'],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  },
};

// Helper function to validate passwords
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { password: config } = securityConfig;

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Helper function to sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

// Helper function to check if file type is allowed
export function isAllowedFileType(mimeType: string): boolean {
  return securityConfig.validation.allowedFileTypes.includes(mimeType);
}

// Helper function to check file size
export function isFileSizeAllowed(sizeInBytes: number): boolean {
  return sizeInBytes <= securityConfig.validation.maxFileSize;
}
