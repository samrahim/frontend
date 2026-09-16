// hooks/useAttendanceSubscription.ts
import { useEffect } from "react";
import { useAttendancesUpdatedSubscription } from "../graphql";

type Props = {
  onAttendanceUpdate?: (attendance: any) => void;
};

export function useAttendanceRealtime({ onAttendanceUpdate }: Props = {}) {
  const { data, loading, error } = useAttendancesUpdatedSubscription();

  useEffect(() => {
    if (!data?.attendancesUpdated) return;

    console.log("📡 Attendance update received:", data.attendancesUpdated);

    onAttendanceUpdate?.(data.attendancesUpdated);
  }, [data, onAttendanceUpdate]);

  return {
    data: data?.attendancesUpdated ?? null,
    loading,
    isConnected: !loading && !error,
    error: error ?? null,
  };
}
