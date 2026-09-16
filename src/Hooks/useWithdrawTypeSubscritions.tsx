import { useEffect, useState } from "react";
import {
  useWithdrawTypeUpdatedSubscription,
  useWithdrawTypeCreatedSubscription,
} from "../graphql/generated";

interface UseWithDrawTypeSubscriptionsOptions {
  withDrawtypeCreated?: (withdraw: any) => void;
  withDrawtypeUpdated?: (withdraw: any) => void;
  enabled?: boolean;
}

interface UseWithDrawTypeSubscriptionsReturn {
  createdWithDraw: any;
  updatedWithDraw: any;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Subscribe to Withdraw creation and update events.
 */
export function useWithDrawTypeSubscriptions({
  withDrawtypeCreated,
  withDrawtypeUpdated,
  enabled = true,
}: UseWithDrawTypeSubscriptionsOptions): UseWithDrawTypeSubscriptionsReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Created subscription
  const {
    data: createdData,
    loading: createdLoading,
    error: createdError,
  } = useWithdrawTypeCreatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Withdraw type creation subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Updated subscription
  const {
    data: updatedData,
    loading: updatedLoading,
    error: updatedError,
  } = useWithdrawTypeUpdatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Withdraw type update subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Handle created event
  useEffect(() => {
    if (createdData?.withdrawTypeCreated) {
      console.log("Withdraw created:", createdData.withdrawTypeCreated);

      withDrawtypeCreated?.(createdData.withdrawTypeCreated);

      setIsConnected(true);
      setError(null);
    }
  }, [createdData, withDrawtypeCreated]);

  // Handle updated event
  useEffect(() => {
    if (updatedData?.withdrawTypeUpdated) {
      console.log("Withdraw updated:", updatedData.withdrawTypeUpdated);

      withDrawtypeUpdated?.(updatedData.withdrawTypeUpdated);

      setIsConnected(true);
      setError(null);
    }
  }, [updatedData, withDrawtypeUpdated]);

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
    createdWithDraw: createdData?.withdrawTypeCreated ?? null,
    updatedWithDraw: updatedData?.withdrawTypeUpdated ?? null,
    isConnected,
    error,
  };
}
