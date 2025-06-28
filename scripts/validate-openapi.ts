import { validateOpenAPISpec } from '../src/lib/openapi/validator';

async function main() {
  console.log('Validating OpenAPI specification...');
  const isValid = await validateOpenAPISpec();

  if (isValid) {
    console.log('✅ OpenAPI specification is valid!');
    process.exit(0);
  } else {
    console.error('❌ OpenAPI specification validation failed');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
