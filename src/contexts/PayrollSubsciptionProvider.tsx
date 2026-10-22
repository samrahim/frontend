import React, { createContext, useContext } from "react";

import {
  TeacherPayrollFieldsFragmentDoc,
  usePayrollCreatedSubscription,
  usePayrollUpdatedSubscription,
} from "../graphql";

interface PayrollSubscriptionContextType {
  // Add manual functions or connection status here if needed in the future
}

const PayrollSubscriptionContext = createContext<
  PayrollSubscriptionContextType | undefined
>(undefined);

export const PayrollSubscriptionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // 1. Handle Real-Time Payroll Creation
  usePayrollCreatedSubscription({
    onData: ({ client, data }) => {
      const created = data.data?.payrollCreated;
      if (!created) return;

      const newRef = client.cache.writeFragment({
        data: created,
        fragment: TeacherPayrollFieldsFragmentDoc,
        fragmentName: "TeacherPayrollFields",
      });

      client.cache.modify({
        fields: {
          // ✅ Changed from 'payrollsTable' to 'payrolls' to match your query
          payrolls(existing, { storeFieldName, readField }) {
            if (!existing) return existing;

            const alreadyThere = existing.edges?.some(
              (e: any) => readField("id", e.node) === created.id
            );
            if (alreadyThere) return existing;

            const argsStr = storeFieldName.slice(
              storeFieldName.indexOf("(") + 1,
              -1
            );
            const args = argsStr ? JSON.parse(argsStr) : {};

            const hasFilter = args.where && Object.keys(args.where).length > 0;
            if (hasFilter) return existing;

            const totalCount =
              existing.totalCount != null
                ? existing.totalCount + 1
                : existing.totalCount;

            if (args.offset && args.offset !== 0) {
              return { ...existing, totalCount };
            }

            const limit = args.limit || existing.edges?.length || 10;
            const edges = [
              { __typename: "TeacherPayrollEdge", node: newRef || created },
              ...(existing.edges || []),
            ].slice(0, limit);

            return { ...existing, totalCount, edges };
          },
        },
      });
    },
    onError: (error) => {
      console.error("Payroll Created Subscription Error:", error);
    },
  });

  // 2. Handle Real-Time Payroll Updates
  usePayrollUpdatedSubscription({
    onData: ({ client, data }) => {
      console.log("RECEIVED SUBSCRIPTION DATA:", data);
      const updated = data.data?.payrollUpdated;
      if (!updated || !updated.id) return;

      const entityId = client.cache.identify({
        __typename: "TeacherPayroll",
        id: updated.id,
      });

      if (!entityId) return;

      client.cache.updateFragment(
        {
          id: entityId,
          fragment: TeacherPayrollFieldsFragmentDoc,
          fragmentName: "TeacherPayrollFields",
        },
        (existingData) => {
          if (!existingData) return updated;
          return {
            ...existingData,
            ...updated,
          };
        }
      );
    },
    onError: (error) => {
      console.error("Payroll Updated Subscription Error:", error);
    },
  });
  return (
    <PayrollSubscriptionContext.Provider value={{}}>
      {children}
    </PayrollSubscriptionContext.Provider>
  );
};

export const usePayrollSubscription = () => {
  const context = useContext(PayrollSubscriptionContext);
  if (!context) {
    throw new Error(
      "usePayrollSubscription must be used within a PayrollSubscriptionProvider"
    );
  }
  return context;
};
