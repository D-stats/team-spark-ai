'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">TeamSpark AI API Documentation</h1>
        <p className="mb-8 text-gray-600">
          This is the API documentation for TeamSpark AI. Use the interactive interface below to
          explore available endpoints.
        </p>
        <div className="rounded-lg border shadow-sm">
          <SwaggerUI url="/api/openapi.json" />
        </div>
      </div>
    </div>
  );
}
