import { useEffect, useState } from "react";
import {
  useOnHifdhCreatedSubscription,
  useOnHifdhUpdatedSubscription,
} from "../graphql/generated";

interface UseHifdhSubscriptionsOptions {
  onHifdhCreated?: (recitation: any) => void;
  onHifdhUpdated?: (recitation: any) => void;
  enabled?: boolean;
}

interface UseHifdhSubscriptionsReturn {
  createdhifdh: any;
  updatedhifdh: any;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Custom hook to subscribe to hifdh creation and update events using graphql-ws
 * Provides real-time updates when hifdh are created or modified by other users
 *
 * Features:
 * - Automatic WebSocket reconnection
 * - Connection status tracking
 * - Error handling and reporting
 *
 * @param {UseHifdhSubscriptionsOptions} options - Configuration options
 * @param {Function} options.onHifdhCreated - Callback when a Hifdh is created
 * @param {Function} options.onHifdhUpdated - Callback when a Hifdh is updated
 * @param {boolean} options.enabled - Enable/disable subscriptions (default: true)
 * @returns {UseHifdhSubscriptionsReturn} Subscription state and Hifdh data
 */
export function useHifdhSubscriptions({
  onHifdhCreated,
  onHifdhUpdated,
  enabled = true,
}: UseHifdhSubscriptionsOptions): UseHifdhSubscriptionsReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to Hifdh creation events via WebSocket
  const {
    data: createdData,
    loading: createdLoading,
    error: createdError,
  } = useOnHifdhCreatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Hifdh creation subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Subscribe to Hifdh update events via WebSocket
  const {
    data: updatedData,
    loading: updatedLoading,
    error: updatedError,
  } = useOnHifdhUpdatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Hifdh update subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Handle Recitaion created events
  useEffect(() => {
    if (createdData?.hifdhCreated && onHifdhCreated) {
      onHifdhCreated(createdData.hifdhCreated);
      setError(null);
      setIsConnected(true);
    }
  }, [createdData?.hifdhCreated, onHifdhCreated]);

  // Handle Recitaion updated events
  useEffect(() => {
    if (updatedData?.hifdhUpdated && onHifdhUpdated) {
      console.log("Hifdh updated:", updatedData.hifdhUpdated);
      onHifdhUpdated(updatedData.hifdhUpdated);
      setError(null);
      setIsConnected(true);
    }
  }, [updatedData?.hifdhUpdated, onHifdhUpdated]);

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
    createdhifdh: createdData?.hifdhCreated,
    updatedhifdh: updatedData?.hifdhUpdated,
    isConnected,
    error,
  };
}
