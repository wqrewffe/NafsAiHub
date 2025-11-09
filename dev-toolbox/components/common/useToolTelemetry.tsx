import { useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { logToolUsage } from '../../../services/firebaseService';
import { toolAccessService } from '../../../services/toolAccessService';

// Hook that returns a function to record telemetry for a tool
export const useToolTelemetry = (toolId: string, toolName: string, category: string) => {
  const { currentUser } = useAuth();

  const recordUsage = useCallback(async (prompt: string, response: string | object) => {
    try {
      if (!currentUser) return null;

      // Log to centralized firebase service
      await logToolUsage(
        currentUser.uid,
        { id: toolId, name: toolName, category },
        prompt,
        typeof response === 'string' ? response : JSON.stringify(response)
      );

      // Record tool use for unlocking/progress
      const result = await toolAccessService.recordToolUse(currentUser.uid, toolId);
      return result;
    } catch (err) {
      console.error('[Telemetry] failed to record usage', err);
      return null;
    }
  }, [currentUser, toolId, toolName, category]);

  return recordUsage;
};
