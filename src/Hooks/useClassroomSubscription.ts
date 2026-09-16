import { useEffect, useState } from "react";
import {
  useClassroomCreatedSubscription,
  useClassroomUpdatedSubscription,
} from "../graphql/generated";

interface UseClassroomSubscriptionsOptions {
  onClassroomCreated?: (Classroom: any) => void;
  onClassroomUpdated?: (Classroom: any) => void;
  enabled?: boolean;
}

interface UseClassroomSubscriptionsReturn {
  createdClassroom: any;
  updatedClassroom: any;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Custom hook to subscribe to Classroom creation and update events using graphql-ws
 * Provides real-time updates when Classroom are created or modified by other users
 *
 * Features:
 * - Automatic WebSocket reconnection
 * - Connection status tracking
 * - Error handling and reporting
 *
 * @param {UseClassroomSubscriptionsOptions} options - Configuration options
 * @param {Function} options.onClassroomCreated - Callback when a Classroom is created
 * @param {Function} options.onClassroomUpdated - Callback when a Classroom is updated
 * @param {boolean} options.enabled - Enable/disable subscriptions (default: true)
 * @returns {UseClassroomSubscriptionsReturn} Subscription state and Classroom data
 */
export function useClassroomSubscriptions({
  onClassroomCreated,
  onClassroomUpdated,
  enabled = true,
}: UseClassroomSubscriptionsOptions): UseClassroomSubscriptionsReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to Classroom creation events via WebSocket
  const {
    data: createdData,
    loading: createdLoading,
    error: createdError,
  } = useClassroomCreatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Classroom creation subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Subscribe to Classroom update events via WebSocket
  const {
    data: updatedData,
    loading: updatedLoading,
    error: updatedError,
  } = useClassroomUpdatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Classroom update subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // Handle Classroom created events
  useEffect(() => {
    if (createdData?.classRoomCreated && onClassroomCreated) {
      console.log("New Classroom created:", createdData.classRoomCreated);
      onClassroomCreated(createdData.classRoomCreated);
      setError(null);
      setIsConnected(true);
    }
  }, [createdData?.classRoomCreated, onClassroomCreated]);

  // Handle Classroom updated events
  useEffect(() => {
    if (updatedData?.classRoomUpdated && onClassroomUpdated) {
      console.log("Classroom updated:", updatedData.classRoomUpdated);
      onClassroomUpdated(updatedData.classRoomUpdated);
      setError(null);
      setIsConnected(true);
    }
  }, [updatedData?.classRoomUpdated, onClassroomUpdated]);

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
    createdClassroom: createdData?.classRoomCreated,
    updatedClassroom: updatedData?.classRoomUpdated,
    isConnected,
    error,
  };
}
