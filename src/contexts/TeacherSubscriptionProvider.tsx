import React, { createContext, useContext } from "react";
import { gql, useSubscription } from "@apollo/client";
import {
  TeacherFieldsFragmentDoc,
  useOnTeacherCreatedSubscription,
  useOnTeacherUpdatedSubscription,
} from "../graphql";

// 1. تعريف الـ Subscription الخاص بحدث المعلمين (إضافة، تعديل، أو تغيير حالة)

interface TeacherSubscriptionContextType {
  // يمكن إضافة دالة manual refetch أو حالة الاتصال إذا احتجتها مستقبلاً
}

const TeacherSubscriptionContext = createContext<
  TeacherSubscriptionContextType | undefined
>(undefined);

export const TeacherSubscriptionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  useOnTeacherCreatedSubscription({
    onData: ({ client, data }) => {
      const created = data.data?.teacherCreated;
      if (!created) return;

      // write the node and get a reference to it
      const newRef = client.cache.writeFragment({
        data: created,
        fragment: TeacherFieldsFragmentDoc,
        fragmentName: "TeacherFields",
      });
      if (!newRef) return;

      client.cache.modify({
        fields: {
          teachersTable(existing, { storeFieldName, readField }) {
            if (!existing) return existing;

            // skip if this teacher is already in the list (e.g. the creator's own mutation added it)
            const alreadyThere = existing.edges?.some(
              (e: any) => readField("id", e.node) === created.id
            );
            if (alreadyThere) return existing;

            // read the arguments of this cached variation
            const argsStr = storeFieldName.slice(
              storeFieldName.indexOf("(") + 1,
              -1
            );
            const args = argsStr ? JSON.parse(argsStr) : {};

            const hasFilter = args.where && Object.keys(args.where).length > 0;
            if (hasFilter) return existing; // can't know if the new teacher matches the filter

            const totalCount =
              existing.totalCount != null
                ? existing.totalCount + 1
                : existing.totalCount;

            // only the first page gets the new row
            if (args.offset !== 0) return { ...existing, totalCount };

            const edges = [
              { __typename: "TeacherEdge", node: newRef },
              ...existing.edges,
            ].slice(0, args.limit); // keep the page size

            return { ...existing, totalCount, edges };
          },

          // plain list without pagination
          teachers(existing, { readField }) {
            if (!existing) return existing;
            const alreadyThere = existing.edges?.some(
              (e: any) => readField("id", e.node) === created.id
            );
            if (alreadyThere) return existing;
            return {
              ...existing,
              edges: [
                { __typename: "TeacherEdge", node: newRef },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
  useOnTeacherUpdatedSubscription({
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
