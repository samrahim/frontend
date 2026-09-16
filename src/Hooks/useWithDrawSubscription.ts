import { useEffect, useState } from "react";
import {
  useOnWithDrawCreatedSubscription,
  useOnWithDrawUpdatedSubscription,
} from "../graphql/generated";

interface UseWithDrawSubscriptionsOptions {
  onWithDrawCreated?: (withdraw: any) => void;
  onWithDrawUpdated?: (withdraw: any) => void;
  enabled?: boolean;
}

interface UseWithDrawSubscriptionsReturn {
  createdWithDraw: any;
  updatedWithDraw: any;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Subscribe to Withdraw creation and update events.
 */
export function useWithDrawSubscriptions({
  onWithDrawCreated,
  onWithDrawUpdated,
  enabled = true,
}: UseWithDrawSubscriptionsOptions): UseWithDrawSubscriptionsReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Created subscription
  const {
    data: createdData,
    loading: createdLoading,
    error: createdError,
  } = useOnWithDrawCreatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Withdraw creation subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Updated subscription
  const {
    data: updatedData,
    loading: updatedLoading,
    error: updatedError,
  } = useOnWithDrawUpdatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Withdraw update subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Handle created event
  useEffect(() => {
    if (createdData?.withdrawCreated) {
      console.log("Withdraw created:", createdData.withdrawCreated);

      onWithDrawCreated?.(createdData.withdrawCreated);

      setIsConnected(true);
      setError(null);
    }
  }, [createdData, onWithDrawCreated]);

  // Handle updated event
  useEffect(() => {
    if (updatedData?.withdrawUpdated) {
      console.log("Withdraw updated:", updatedData.withdrawUpdated);

      onWithDrawUpdated?.(updatedData.withdrawUpdated);

      setIsConnected(true);
      setError(null);
    }
  }, [updatedData, onWithDrawUpdated]);

  // Connection status
  useEffect(() => {
    if (!enabled) return;

    const hasError = createdError || updatedError;

    if (hasError) {
      setError(hasError);
      setIsConnected(false);
    } else if (!createdLoading && !updatedLoading) {
      setIsConnected(true);
      setError(null);
    }
  }, [enabled, createdLoading, updatedLoading, createdError, updatedError]);

  return {
    createdWithDraw: createdData?.withdrawCreated ?? null,
    updatedWithDraw: updatedData?.withdrawUpdated ?? null,
    isConnected,
    error,
  };
}
