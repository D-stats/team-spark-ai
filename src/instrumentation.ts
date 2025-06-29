export async function register(): Promise<void> {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    try {
      const { initializeMonitoring } = await import('@/lib/monitoring');
      initializeMonitoring();
    } catch (error) {
      // Use basic console.warn for instrumentation setup issues since logger may not be available yet
      console.warn('Monitoring temporarily disabled due to import errors:', error);
      // TODO: Fix OpenTelemetry Resource import issue
    }
  }
}
