declare namespace NodeJS {
  interface ProcessEnv {
    // Node environment
    NODE_ENV: 'development' | 'production' | 'test';

    // Database
    DATABASE_URL: string;

    // App URLs
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_DEFAULT_LOCALE: string;

    // Authentication
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;

    // Slack Integration
    SLACK_CLIENT_ID: string;
    SLACK_CLIENT_SECRET: string;
    SLACK_SIGNING_SECRET: string;
    SLACK_BOT_TOKEN: string;

    // Email
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;

    // Redis
    REDIS_URL: string;

    // Monitoring
    OTEL_SERVICE_NAME?: string;
    OTEL_EXPORTER_OTLP_ENDPOINT?: string;
    OTEL_EXPORTER_OTLP_HEADERS?: string;

    // Security
    ALLOWED_ORIGINS?: string;

    // Package info
    npm_package_version?: string;

    // CI/CD
    CI?: string;

    // Port
    PORT?: string;
  }
}

// This file needs to be a module
export {};
