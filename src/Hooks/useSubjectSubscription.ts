import { useEffect, useState } from "react";
import {
  useOnSubjectCreatedSubscription,
  useOnSubjectUpdatedSubscription,
} from "../graphql/generated";

interface UseSubjectSubscriptionsOptions {
  onSubjectCreated?: (Subject: any) => void;
  onSubjectUpdated?: (Subject: any) => void;
  enabled?: boolean;
}

interface UseSubjectSubscriptionsReturn {
  createdSubject: any;
  updatedSubject: any;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Custom hook to subscribe to Subject creation and update events using graphql-ws
 * Provides real-time updates when Subjects are created or modified by other users
 *
 * Features:
 * - Automatic WebSocket reconnection
 * - Connection status tracking
 * - Error handling and reporting
 *
 * @param {UseSubjectSubscriptionsOptions} options - Configuration options
 * @param {Function} options.onSubjectCreated - Callback when a Subject is created
 * @param {Function} options.onSubjectUpdated - Callback when a Subject is updated
 * @param {boolean} options.enabled - Enable/disable subscriptions (default: true)
 * @returns {UseSubjectSubscriptionsReturn} Subscription state and Subject data
 */
export function useSubjectSubscriptions({
  onSubjectCreated,
  onSubjectUpdated,
  enabled = true,
}: UseSubjectSubscriptionsOptions): UseSubjectSubscriptionsReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to Subject creation events via WebSocket
  const {
    data: createdData,
    loading: createdLoading,
    error: createdError,
  } = useOnSubjectCreatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Subject creation subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Subscribe to Subject update events via WebSocket
  const {
    data: updatedData,
    loading: updatedLoading,
    error: updatedError,
  } = useOnSubjectUpdatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Subject update subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Handle Subject created events
  useEffect(() => {
    if (createdData?.subjectCreated && onSubjectCreated) {
      onSubjectCreated(createdData.subjectCreated);
      setError(null);
      setIsConnected(true);
    }
  }, [createdData?.subjectCreated, onSubjectCreated]);

  // Handle Subject updated events
  useEffect(() => {
    if (updatedData?.subjectUpdated && onSubjectUpdated) {
      console.log("Subject updated:", updatedData.subjectUpdated);
      onSubjectUpdated(updatedData.subjectUpdated);
      setError(null);
      setIsConnected(true);
    }
  }, [updatedData?.subjectUpdated, onSubjectUpdated]);

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
    createdSubject: createdData?.subjectCreated,
    updatedSubject: updatedData?.subjectUpdated,
    isConnected,
    error,
  };
}
