import { useEffect, useState } from "react";
import {
  useOnRecitaionCreatedSubscription,
  useOnRecitaionUpdatedSubscription,
} from "../graphql/generated";

interface UseRecitationSubscriptionsOptions {
  onRecitationCreated?: (recitation: any) => void;
  onRecitationUpdated?: (recitation: any) => void;
  enabled?: boolean;
}

interface UseRecitationSubscriptionsReturn {
  createdRecitation: any;
  updatedRecitation: any;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Custom hook to subscribe to Recitaion creation and update events using graphql-ws
 * Provides real-time updates when Recitaions are created or modified by other users
 *
 * Features:
 * - Automatic WebSocket reconnection
 * - Connection status tracking
 * - Error handling and reporting
 *
 * @param {UseRecitationSubscriptionsOptions} options - Configuration options
 * @param {Function} options.onRecitationCreated - Callback when a Recitaion is created
 * @param {Function} options.onRecitationUpdated - Callback when a Recitaion is updated
 * @param {boolean} options.enabled - Enable/disable subscriptions (default: true)
 * @returns {UseRecitaionSubscriptionsReturn} Subscription state and Recitaion data
 */
export function useRecitaionSubscriptions({
  onRecitationCreated,
  onRecitationUpdated,
  enabled = true,
}: UseRecitationSubscriptionsOptions): UseRecitationSubscriptionsReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to Recitaion creation events via WebSocket
  const {
    data: createdData,
    loading: createdLoading,
    error: createdError,
  } = useOnRecitaionCreatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Recitaion creation subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Subscribe to Recitaion update events via WebSocket
  const {
    data: updatedData,
    loading: updatedLoading,
    error: updatedError,
  } = useOnRecitaionUpdatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Recitaion update subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Handle Recitaion created events
  useEffect(() => {
    if (createdData?.recitationCreated && onRecitationCreated) {
      onRecitationCreated(createdData.recitationCreated);
      setError(null);
      setIsConnected(true);
    }
  }, [createdData?.recitationCreated, onRecitationCreated]);

  // Handle Recitaion updated events
  useEffect(() => {
    if (updatedData?.recitationUpdated && onRecitationUpdated) {
      console.log("Recitaion updated:", updatedData.recitationUpdated);
      onRecitationUpdated(updatedData.recitationUpdated);
      setError(null);
      setIsConnected(true);
    }
  }, [updatedData?.recitationUpdated, onRecitationUpdated]);

  // Update connection status based on subscription state
  useEffect(() => {
    if (enabled) {
      const hasError = createdError || updatedError;
      if (hasError) {
        setError(hasError);
        setIsConnected(false);
      } else if (!createdLoading && !updatedLoading) {
        setIsConnected(true);
        setError(null);
      }
    }
  }, [createdError, updatedError, createdLoading, updatedLoading, enabled]);

  return {
    createdRecitation: createdData?.recitationCreated,
    updatedRecitation: updatedData?.recitationUpdated,
    isConnected,
    error,
  };
}
