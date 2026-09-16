import { ReactNode, createContext, useCallback, useContext } from "react";
import { gql, useApolloClient } from "@apollo/client";
import { useStudentSubscriptions } from "../Hooks/useStudentSubscription";
import { useNotifications } from "../providers/NotificationProvider";

interface ContextType {
  isConnected: boolean;
  error: Error | null;
}

const StudentSubContext = createContext<ContextType | undefined>(undefined);

export function StudentSubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { addNotification } = useNotifications();
  const apolloClient = useApolloClient();

  const handleStudentCreated = useCallback(
    (student: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Student",
      //   message: `${student.firstName} ${student.lastName} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      setTimeout(() => {
        apolloClient.cache.evict({ fieldName: "studentsTable" });
        apolloClient.cache.gc();
      }, 0);
    },
    [apolloClient, addNotification]
  );

  const handleStudentUpdated = useCallback(
    (student: any) => {
      if (!student?.id) return;

      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Student",
      //   message: `${student.firstName || "Student"} ${
      //     student.lastName || ""
      //   } updated`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      const formattedEnrollments = student.enroll?.map((e: any) => ({
        __typename: "CourseEnrollment",
        startAt: e.startAt,
        stopped: e.stopped ?? false,
        note: e.note ?? null,
        endAt: e.endAt ?? null,
        discount: e.discount ?? 0,
        stoppedBy: e.stoppedBy
          ? {
              __typename: "User",
              id: e.stoppedBy.id,
              firstName: e.stoppedBy.firstName,
              lastName: e.stoppedBy.lastName,
            }
          : null,
        creator: e.creator
          ? {
              __typename: "User",
              id: e.creator.id,
              firstName: e.creator.firstName,
              lastName: e.creator.lastName,
            }
          : null,
        group: e.group
          ? {
              __typename: "Group",
              id: e.group.id,
              name: e.group.name,
            }
          : null,
      }));

      try {
        apolloClient.cache.writeFragment({
          id: apolloClient.cache.identify({
            __typename: "Student",
            id: student.id,
          }),
          fragment: gql`
            fragment StudentUpdate on Student {
              id
              firstName
              lastName
              dateOfBirth
              phone
              gender
              email
              isSick
              healthNote
              parent {
                id
                firstName
                lastName
                familyMember
                phones
              }
              enroll {
                startAt
                stopped
                note
                endAt
                discount
                stoppedBy {
                  id
                  firstName
                  lastName
                }
                creator {
                  id
                  firstName
                  lastName
                }
                group {
                  id
                  name
                }
              }
            }
          `,
          data: {
            ...student,
            enroll: formattedEnrollments,
          },
        });
        apolloClient.cache.evict({ id: `Student:${student.id}` });
        apolloClient.cache.gc();
      } catch (error) {
        console.error("Apollo writeFragment failed:", error);
      }
    },
    [apolloClient, addNotification]
  );

  const { isConnected, error } = useStudentSubscriptions({
    onStudentCreated: handleStudentCreated,
    onStudentUpdated: handleStudentUpdated,
    enabled: true,
  });

  return (
    <StudentSubContext.Provider value={{ isConnected, error }}>
      {children}
    </StudentSubContext.Provider>
  );
}

export const useStudentSubscriptionStatus = () => useContext(StudentSubContext);
