import { useEffect, useState } from "react";
import {
  useOnStudentCreatedSubscription,
  useOnStudentUpdatedSubscription,
} from "../graphql/generated";

interface UseStudentSubscriptionsOptions {
  onStudentCreated?: (teacher: any) => void;
  onStudentUpdated?: (teacher: any) => void;
  enabled?: boolean;
}

interface UseStudentSubscriptionsReturn {
  createdStudent: any;
  updatedStudent: any;
  isConnected: boolean;
  error: Error | null;
}

export function useStudentSubscriptions({
  onStudentCreated,
  onStudentUpdated,
  enabled = true,
}: UseStudentSubscriptionsOptions): UseStudentSubscriptionsReturn {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 🔹 student Created Subscription
  const {
    data: createdData,
    loading: createdLoading,
    error: createdError,
  } = useOnStudentCreatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("student creation subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // 🔹 student Updated Subscription
  const {
    data: updatedData,
    loading: updatedLoading,
    error: updatedError,
  } = useOnStudentUpdatedSubscription({
    skip: !enabled,
    onError: (err) => {
      console.error("Student update subscription error:", err);
      setError(err);
      setIsConnected(false);
    },
  });

  // ✅ Handle student created
  useEffect(() => {
    if (createdData?.studentCreated && onStudentCreated) {
      console.log("New Student created:", createdData.studentCreated);
      onStudentCreated(createdData.studentCreated);
      setError(null);
      setIsConnected(true);
    }
  }, [createdData?.studentCreated, onStudentCreated]);

  // ✅ Handle student updated
  useEffect(() => {
    if (updatedData?.studentUpdated && onStudentUpdated) {
      console.log("Student updated:", updatedData.studentUpdated);
      onStudentUpdated(updatedData.studentUpdated);
      setError(null);
      setIsConnected(true);
    }
  }, [updatedData?.studentUpdated, onStudentUpdated]);

  // 🔁 Connection state handling
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
    createdStudent: createdData?.studentCreated,
    updatedStudent: updatedData?.studentUpdated,
    isConnected,
    error,
  };
}
