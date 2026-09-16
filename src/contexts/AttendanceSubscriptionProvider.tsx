import React, { createContext, useContext } from "react";
import { gql, useSubscription } from "@apollo/client";

// 1. تعريف الـ Subscription الخاص بتحديثات وسجلات الحضور والغياب
const ATTENDANCE_UPDATED_SUBSCRIPTION = gql`
  subscription OnAttendanceUpdated {
    attendanceUpdated {
      id
      studentId
      groupId
      sessionId
      status
      date
      updatedAt
    }
  }
`;

interface AttendanceSubscriptionContextType {
  // يمكن إضافة قيم أو دوال حالة للـ Provider عند الحاجة مستقبلاً
}

const AttendanceSubscriptionContext = createContext<
  AttendanceSubscriptionContextType | undefined
>(undefined);

export const AttendanceSubscriptionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // 2. تفعيل الاستماع اللحظي لسجلات الحضور
  useSubscription(ATTENDANCE_UPDATED_SUBSCRIPTION, {
    onData: ({ client, data }) => {
      const updatedAttendance = data.data?.attendanceUpdated;

      if (!updatedAttendance) return;

      // 3. تحديث كاش Apollo مباشرة لتحديث الجداول أو الإحصائيات في الصفحة فوراً
      client.cache.modify({
        id: client.cache.identify({
          __typename: "Attendance",
          id: updatedAttendance.id,
        }),
        fields: {
          status() {
            return updatedAttendance.status;
          },
          date() {
            return updatedAttendance.date;
          },
        },
      });
    },
    onError: (error) => {
      console.error("Attendance Subscription Error:", error);
    },
  });

  return (
    <AttendanceSubscriptionContext.Provider value={{}}>
      {children}
    </AttendanceSubscriptionContext.Provider>
  );
};

export const useAttendanceSubscription = () => {
  const context = useContext(AttendanceSubscriptionContext);
  if (!context) {
    throw new Error(
      "useAttendanceSubscription must be used within an AttendanceSubscriptionProvider"
    );
  }
  return context;
};
