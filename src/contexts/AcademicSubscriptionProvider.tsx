import { ReactNode, createContext, useCallback, useContext } from "react";
import { useApolloClient } from "@apollo/client";
import { useClassroomSubscriptions } from "../Hooks/useClassroomSubscription";
import { useRecitaionSubscriptions } from "../Hooks/useRecitationSubscribtion";
import { useHifdhSubscriptions } from "../Hooks/useHifdhSubscription";
import { useNotifications } from "../providers/NotificationProvider";
import { useSubjectSubscriptions } from "../Hooks/useSubjectSubscription";

interface ContextType {
  isConnected: boolean;
  error: Error | null;
}

const AcademicSubContext = createContext<ContextType | undefined>(undefined);

export function AcademicSubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { addNotification } = useNotifications();
  const apolloClient = useApolloClient();

  // 🔹 SUBJECT HANDLERS
  const handleSubjectCreated = useCallback(
    (subject: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Subject",
      //   message: `${subject.name} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.modify({
        fields: {
          subjects(existing = { edges: [] }) {
            if (existing.edges.some((edge: any) => edge.node.id === subject.id))
              return existing;
            return {
              ...existing,
              edges: [
                { __typename: "SubjectEdge", node: subject },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
    [apolloClient, addNotification]
  );

  const handleSubjectUpdated = useCallback(
    (subject: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Subject",
      //   message: `${subject.name} updated`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.modify({
        fields: {
          subjects(existing = { edges: [] }) {
            return {
              ...existing,
              edges: existing.edges.map((edge: any) =>
                edge.node.id === subject.id ? { ...edge, node: subject } : edge
              ),
            };
          },
        },
      });
    },
    [apolloClient, addNotification]
  );

  // 🔹 RECITATIONS HANDLERS
  const handleRecitaionCreated = useCallback(
    (recitation: any) => {
      apolloClient.cache.modify({
        fields: {
          recitations(existing = { edges: [] }) {
            if (
              existing.edges.some((edge: any) => edge.node.id === recitation.id)
            )
              return existing;
            return {
              ...existing,
              edges: [
                { __typename: "RecitationEdge", node: recitation },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
    [apolloClient]
  );

  const handleRecitaionUpdated = useCallback(
    (recitation: any) => {
      apolloClient.cache.modify({
        fields: {
          recitations(existing = { edges: [] }) {
            // Fixed: updated recitations field directly
            return {
              ...existing,
              edges: existing.edges.map((edge: any) =>
                edge.node.id === recitation.id
                  ? { ...edge, node: recitation }
                  : edge
              ),
            };
          },
        },
      });
    },
    [apolloClient]
  );

  // 🔹 HIFDH HANDLERS
  const handleHifdhCreated = useCallback(
    (hifdh: any) => {
      apolloClient.cache.modify({
        fields: {
          hifdhs(existing = { edges: [] }) {
            if (existing.edges.some((edge: any) => edge.node.id === hifdh.id))
              return existing;
            return {
              ...existing,
              edges: [
                { __typename: "HifdhEdge", node: hifdh },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
    [apolloClient]
  );

  const handleHifdhUpdated = useCallback(
    (hifdh: any) => {
      apolloClient.cache.modify({
        fields: {
          hifdhs(existing = { edges: [] }) {
            // Fixed: updated hifdhs field directly
            return {
              ...existing,
              edges: existing.edges.map((edge: any) =>
                edge.node.id === hifdh.id ? { ...edge, node: hifdh } : edge
              ),
            };
          },
        },
      });
    },
    [apolloClient]
  );

  // =========================
  // 🔹 CLASSROOM HANDLERS
  // =========================
  const handleClassroomCreated = useCallback(
    (classroom: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Classroom",
      //   message: `${classroom.name} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.modify({
        fields: {
          // Note: Must match exactly how it's queried (classRooms)
          classRooms(existing = { edges: [] }) {
            // Prevent duplicates if already in cache via mutation response
            if (
              existing.edges.some((edge: any) => edge.node.id === classroom.id)
            ) {
              return existing;
            }

            const newEdge = {
              __typename: "ClassRoomEdge", // Must be Edge, not Connection
              node: classroom,
            };

            return {
              ...existing,
              edges: [newEdge, ...existing.edges],
            };
          },
        },
      });
    },
    [apolloClient, addNotification]
  );

  const handleClassroomUpdated = useCallback(
    (classroom: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Classroom",
      //   message: `${classroom.name} updated`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.modify({
        fields: {
          classRooms(existing = { edges: [] }) {
            return {
              ...existing,
              edges: existing.edges.map((edge: any) =>
                edge.node.id === classroom.id
                  ? { ...edge, node: classroom }
                  : edge
              ),
            };
          },
        },
      });
    },
    [apolloClient, addNotification]
  );

  const { isConnected: subjectConn, error: subjectErr } =
    useSubjectSubscriptions({
      onSubjectCreated: handleSubjectCreated,
      onSubjectUpdated: handleSubjectUpdated,
      enabled: true,
    });

  const { isConnected: classroomConn, error: classroomErr } =
    useClassroomSubscriptions({
      onClassroomCreated: handleClassroomCreated,
      onClassroomUpdated: handleClassroomUpdated,
      enabled: true,
    });

  const { isConnected: recConn, error: recErr } = useRecitaionSubscriptions({
    onRecitationCreated: handleRecitaionCreated,
    onRecitationUpdated: handleRecitaionUpdated,
    enabled: true,
  });

  const { isConnected: hifdhConn, error: hifdhErr } = useHifdhSubscriptions({
    onHifdhCreated: handleHifdhCreated,
    onHifdhUpdated: handleHifdhUpdated,
    enabled: true,
  });

  return (
    <AcademicSubContext.Provider
      value={{
        isConnected: subjectConn && recConn && hifdhConn && classroomConn,
        error: subjectErr || recErr || hifdhErr || classroomErr,
      }}
    >
      {children}
    </AcademicSubContext.Provider>
  );
}

export const useAcademicSubscriptionStatus = () =>
  useContext(AcademicSubContext);
