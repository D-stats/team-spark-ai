export async function register(): Promise<void> {
  // Temporarily disable monitoring during TSA-46 development to fix build issues
  // TODO: Re-enable after resolving OpenTelemetry vendor chunk issues
  if (process.env['NEXT_RUNTIME'] === 'nodejs' && process.env.NODE_ENV === 'development') {
    try {
      // Only load monitoring in production or when explicitly enabled
      if (process.env['ENABLE_MONITORING'] === 'true') {
        const { initializeMonitoring } = await import('@/lib/monitoring');
        initializeMonitoring();
      }
    } catch (error) {
      // Use basic console.warn for instrumentation setup issues since logger may not be available yet
      console.warn('Monitoring temporarily disabled due to import errors:', error);
      // TODO: Fix OpenTelemetry Resource import issue
    }
  }
}
