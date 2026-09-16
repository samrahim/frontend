import React, { createContext, useContext } from "react";
import { useApolloClient, gql } from "@apollo/client";
import { useOnfamilymemberCreatedSubscription } from "../graphql"; // Adjust path to your codegen output
import { useNotifications } from "../providers/NotificationProvider";

// ---- Context type (type only, never used as a value) ----
interface FamilyMemberSubscriptionContextValue {}

// ---- Context object (the actual runtime value) ----
const FamilyMemberSubscriptionContext = createContext<
  FamilyMemberSubscriptionContextValue | undefined
>(undefined);

// Fragment used to write the newly created FamilyMember into the cache.
const FamilyMemberBasicInfoFragment = gql`
  fragment FamilyMemberBasicInfo on FamilyMember {
    id
    type
  }
`;

export const FamilyMemberSubscriptionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const client = useApolloClient();
  const { addNotification } = useNotifications();

  useOnfamilymemberCreatedSubscription({
    onData: ({ data }) => {
      console.log("WS event received:", data);
      const created = data.data?.familyMemberCreated;
      if (!created) return;

      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Family member",
      //   message: `${created.type || "Family member"} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      // Write the new entity into the cache.
      client.cache.writeFragment({
        id: client.cache.identify({
          __typename: "FamilyMember",
          id: created.id,
        }),
        fragment: FamilyMemberBasicInfoFragment,
        data: created,
      });

      // Prepend it to the paginated list field.
      // "getfamilyMembers" must match the exact field name used in your query.
      client.cache.modify({
        fields: {
          getfamilyMembers(
            existing = { edges: [], pageInfo: {} },
            { toReference, readField }
          ) {
            const newRef = toReference(
              { __typename: "FamilyMember", id: created.id },
              true
            );
            if (!newRef) return existing;

            const alreadyExists = existing.edges?.some(
              (edge: any) => readField("id", edge.node) === created.id
            );
            if (alreadyExists) return existing;

            return {
              ...existing,
              edges: [
                { __typename: "FamilyMemberEdge", node: newRef },
                ...(existing.edges ?? []),
              ],
            };
          },
        },
      });
    },
    onError: (err) =>
      console.error("OnFamilyMemberCreated Subscription Error:", err),
  });

  return (
    <FamilyMemberSubscriptionContext.Provider value={{}}>
      {children}
    </FamilyMemberSubscriptionContext.Provider>
  );
};

export const useFamilyMemberSubscription = () => {
  const context = useContext(FamilyMemberSubscriptionContext);
  if (!context) {
    throw new Error(
      "useFamilyMemberSubscription must be used within a FamilyMemberSubscriptionProvider"
    );
  }
  return context;
};
