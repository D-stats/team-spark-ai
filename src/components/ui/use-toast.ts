// Simple toast implementation
export function useToast(): {
  toast: (message: string | { title?: string; description?: string; variant?: string }) => void;
} {
  return {
    toast: (_message: string | { title?: string; description?: string; variant?: string }) => {
      // TODO: Implement actual toast functionality
    },
  };
}
