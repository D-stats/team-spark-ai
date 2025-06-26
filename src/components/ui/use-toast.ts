// Simple toast implementation
export function useToast() {
  return {
    toast: (message: string | { title?: string; description?: string; variant?: string }) => {
      if (typeof message === 'string') {
        console.log('Toast:', message);
      } else {
        console.log('Toast:', message.title || message.description);
      }
    },
  };
}
