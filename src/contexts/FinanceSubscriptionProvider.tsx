import { ReactNode, createContext, useCallback, useContext } from "react";
import { useApolloClient } from "@apollo/client";
import { useWithDrawSubscriptions } from "../Hooks/useWithDrawSubscription";

import { useNotifications } from "../providers/NotificationProvider";
import { useWithDrawTypeSubscriptions } from "../Hooks/useWithdrawTypeSubscritions";

interface ContextType {
  isConnected: boolean;
  error: Error | null;
}

const FinanceSubContext = createContext<ContextType | undefined>(undefined);

export function FinanceSubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { addNotification } = useNotifications();
  const apolloClient = useApolloClient();

  // 🔹 WITHDRAW HANDLERS
  const handleWithDrawCreated = useCallback(
    (withdraw: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Withdraw",
      //   message: `${withdraw.amount} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.evict({ fieldName: "withdraws" });
      apolloClient.cache.gc();
    },
    [apolloClient, addNotification]
  );

  const handleWithDrawUpdated = useCallback(
    (withdraw: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "WithDraw",
      //   message: `${withdraw.name} with amount of ${withdraw.amount} updated`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.modify({
        fields: {
          withdraws(existing = { edges: [] }) {
            return {
              ...existing,
              edges: existing.edges.map((edge: any) =>
                edge.node.id === withdraw.id
                  ? { ...edge, node: withdraw }
                  : edge
              ),
            };
          },
        },
      });
    },
    [apolloClient, addNotification]
  );

  // 🔹 WITHDRAW TYPE HANDLERS
  const handleWithDrawTypeCreated = useCallback(
    (withdrawtype: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Withdraw type",
      //   message: `${withdrawtype.amount} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.evict({ fieldName: "withdrawTypes" });
      apolloClient.cache.gc();
    },
    [apolloClient, addNotification]
  );

  const handleWithDrawTypeUpdated = useCallback(
    (withdrawtype: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "WithDraw Type",
      //   message: `${withdrawtype.name} with amount of ${withdrawtype.amount} updated`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.modify({
        fields: {
          withdrawTypes(existing = { edges: [] }) {
            return {
              ...existing,
              edges: existing.edges.map((edge: any) =>
                edge.node.id === withdrawtype.id
                  ? { ...edge, node: withdrawtype }
                  : edge
              ),
            };
          },
        },
      });
    },
    [apolloClient, addNotification]
  );

  const { isConnected: withDrawConn, error: withDrawErr } =
    useWithDrawSubscriptions({
      onWithDrawCreated: handleWithDrawCreated,
      onWithDrawUpdated: handleWithDrawUpdated,
      enabled: true,
    });

  const { isConnected: withdrawTypeConn, error: withdrawTypeErr } =
    useWithDrawTypeSubscriptions({
      withDrawtypeCreated: handleWithDrawTypeCreated,
      withDrawtypeUpdated: handleWithDrawTypeUpdated,
      enabled: true,
    });

  return (
    <FinanceSubContext.Provider
      value={{
        isConnected: withDrawConn && withdrawTypeConn,
        error: withDrawErr || withdrawTypeErr,
      }}
    >
      {children}
    </FinanceSubContext.Provider>
  );
}

export const useFinanceSubscriptionStatus = () => useContext(FinanceSubContext);
