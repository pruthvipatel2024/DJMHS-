import { useEffect } from 'react';

/**
 * Hook to warn users before leaving or refreshing the browser if they have unsubmitted changes
 */
export const useUnsavedWarning = (isDirty: boolean, customMessage?: string) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      const message = customMessage || 'You have unsubmitted changes in your active session. Are you sure you want to refresh or leave? Your entered draft has been cached.';
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, customMessage]);
};

export default useUnsavedWarning;
