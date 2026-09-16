import React, { createContext, useContext } from "react";
import { gql, useSubscription } from "@apollo/client";

// 1. تعريف الـ Subscription الخاص بحدث المعلمين (إضافة، تعديل، أو تغيير حالة)
const TEACHER_UPDATED_SUBSCRIPTION = gql`
  subscription OnTeacherUpdated {
    teacherUpdated {
      id
      firstName
      lastName
      phone

      updatedAt
    }
  }
`;

interface TeacherSubscriptionContextType {
  // يمكن إضافة دالة manual refetch أو حالة الاتصال إذا احتجتها مستقبلاً
}

const TeacherSubscriptionContext = createContext<
  TeacherSubscriptionContextType | undefined
>(undefined);

export const TeacherSubscriptionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // 2. تفعيل الاستماع التلقائي
  useSubscription(TEACHER_UPDATED_SUBSCRIPTION, {
    onData: ({ client, data }) => {
      const updatedTeacher = data.data?.teacherUpdated;

      if (!updatedTeacher) return;

      // 3. تحديث Apollo Cache مباشرة عند ورود أي تغيير على المعلم
      client.cache.modify({
        id: client.cache.identify({
          __typename: "Teacher",
          id: updatedTeacher.id,
        }),
        fields: {
          firstName() {
            return updatedTeacher.firstName;
          },
          lastName() {
            return updatedTeacher.lastName;
          },
          phone() {
            return updatedTeacher.phone;
          },
        },
      });
    },
    onError: (error) => {
      console.error("Teacher Subscription Error:", error);
    },
  });

  return (
    <TeacherSubscriptionContext.Provider value={{}}>
      {children}
    </TeacherSubscriptionContext.Provider>
  );
};

export const useTeacherSubscription = () => {
  const context = useContext(TeacherSubscriptionContext);
  if (!context) {
    throw new Error(
      "useTeacherSubscription must be used within a TeacherSubscriptionProvider"
    );
  }
  return context;
};
