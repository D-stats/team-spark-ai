export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { initializeMonitoring } = await import('@/lib/monitoring');
      initializeMonitoring();
    } catch (error) {
      console.log('Monitoring temporarily disabled due to import errors');
      // TODO: Fix OpenTelemetry Resource import issue
    }
  }
}
