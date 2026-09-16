import { ReactNode, createContext, useCallback, useContext } from "react";
import { gql, useApolloClient } from "@apollo/client";
import {
  useGroupSubscriptions,
  useTeacherSubscriptions,
  useStudentSubscriptions,
  useSubjectSubscriptions,
  useWithDrawSubscriptions,
  useClassroomSubscriptions,
  useRecitaionSubscriptions,
  useWithDrawTypeSubscriptions,
} from "../Hooks";
import { useNotifications } from "../providers/NotificationProvider";
import { useAttendanceRealtime } from "../Hooks/useAttendanceSubscription";
import { useHifdhSubscriptions } from "../Hooks/useHifdhSubscription";
interface SubscriptionContextType {
  isSubscriptionsActive: boolean;
  subscriptionError: Error | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

/**
 * Provides global subscription management for the entire app
 * Ensures subscriptions persist across page navigation
 */
export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { addNotification } = useNotifications();

  const apolloClient = useApolloClient();

  // =========================
  // 🔹 GROUP HANDLERS
  // =========================
  const handleGroupCreated = useCallback(
    (group: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Group",
      //   message: `${group.name} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.evict({ fieldName: "groupsTable" });
      apolloClient.cache.gc();
    },
    [apolloClient, addNotification]
  );
  const handleGroupUpdated = useCallback(
    (data: any) => {
      const group = data?.groupUpdated || data;
      console.log("Group updated subscription received:", group);
      if (!group?.id) return;

      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Group",
      //   message: `Group details updated`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.writeFragment({
        id: apolloClient.cache.identify({ __typename: "Group", id: group.id }),
        fragment: gql`
          fragment GroupSubscriptionUpdate on Group {
            id
            blockStudents
            assignments {
              id
              teacher {
                id
                firstName
                lastName
              }
            }
            course {
              id
              stopped
              startAt
              endAt
              note
              stoppedReason
              discount
              student {
                id
                firstName
                lastName
              }
              creator {
                firstName
                lastName
              }
            }
          }
        `,
        data: {
          __typename: "Group",
          id: group.id,
          blockStudents: group.blockStudents,
          assignments: group.assignments?.map((a: any) => ({
            __typename: "TeachingAssignment",
            id: a.id,
            teacher: a.teacher
              ? {
                  __typename: "Teacher",
                  id: a.teacher.id,
                  firstName: a.teacher.firstName,
                  lastName: a.teacher.lastName,
                }
              : null,
          })),
          course: group.course?.map((c: any) => ({
            __typename: "CourseEnrollment", // Match your GraphQL schema typename
            id: c.id, // Key for Apollo Cache normalization
            stopped: c.stopped, // Needed for state checks
            startAt: c.startAt,
            endAt: c.endAt,
            note: c.note,
            stoppedReason: c.stoppedReason,
            discount: c.discount,
            student: c.student
              ? {
                  __typename: "Student",
                  id: c.student.id,
                  firstName: c.student.firstName,
                  lastName: c.student.lastName,
                }
              : null,
            creator: c.creator
              ? {
                  __typename: "User",
                  firstName: c.creator.firstName,
                  lastName: c.creator.lastName,
                }
              : null,
          })),
        },
      });
    },
    [apolloClient, addNotification]
  );

  // =========================
  // 🔹 SUBJECT HANDLERS
  // =========================
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
            if (
              existing.edges.some((edge: any) => edge.node.id === subject.id)
            ) {
              return existing;
            }

            const newEdge = {
              __typename: "SubjectEdge",
              node: subject,
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
  // =========================
  // 🔹 RECITATIONS HANDLERS
  // =========================
  const handleRecitaionCreated = useCallback(
    (recitation: any) => {
      apolloClient.cache.modify({
        fields: {
          recitations(existing = { edges: [] }) {
            if (
              existing.edges.some((edge: any) => edge.node.id === recitation.id)
            ) {
              return existing;
            }

            const newEdge = {
              __typename: "RecitationEdge",
              node: recitation,
            };

            return {
              ...existing,
              edges: [newEdge, ...existing.edges],
            };
          },
        },
      });
    },
    [apolloClient]
  );
  const handleRecitaionUpdated = useCallback(
    (recitaion: any) => {
      apolloClient.cache.modify({
        fields: {
          subjects(existing = { edges: [] }) {
            return {
              ...existing,
              edges: existing.edges.map((edge: any) =>
                edge.node.id === recitaion.id
                  ? { ...edge, node: recitaion }
                  : edge
              ),
            };
          },
        },
      });
    },
    [apolloClient]
  );

  // =========================
  // 🔹 HIFDH HANDLERS
  // =========================
  const handleHifdhCreated = useCallback(
    (hifdh: any) => {
      apolloClient.cache.modify({
        fields: {
          hifdhs(existing = { edges: [] }) {
            if (existing.edges.some((edge: any) => edge.node.id === hifdh.id)) {
              return existing;
            }

            const newEdge = {
              __typename: "HifdhEdge",
              node: hifdh,
            };

            return {
              ...existing,
              edges: [newEdge, ...existing.edges],
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
          subjects(existing = { edges: [] }) {
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
  // =========================
  // 🔹 ATTENDANCE HANDLER
  // =========================
  const handleAttendancesUpdated = useCallback(
    (updatedAttendancePayload: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Attendance",
      //   message: "Attendance updated",
      //   createdAt: new Date(),
      //   read: false,
      // });

      if (!updatedAttendancePayload) return;

      // Standardize input payload as an array regardless of single or batch object return
      const updatedList: any[] = Array.isArray(updatedAttendancePayload)
        ? updatedAttendancePayload
        : [updatedAttendancePayload];

      // Create a Quick Lookup Map by ID
      const updatedMap = new Map(updatedList.map((item) => [item.id, item]));

      apolloClient.cache.modify({
        fields: {
          attendances(existing = { edges: [] }) {
            if (!existing || !existing.edges) return existing;

            const newEdges = existing.edges.map((edge: any) => {
              const updatedItem = updatedMap.get(edge?.node?.id);
              if (updatedItem) {
                return {
                  ...edge,
                  node: {
                    ...edge.node,
                    ...updatedItem,
                  },
                };
              }
              return edge;
            });

            return {
              ...existing,
              edges: newEdges,
            };
          },
        },
      });
    },
    [apolloClient, addNotification]
  );
  // =========================
  // 🔹 TEACHER HANDLERS
  // =========================

  const handleTeacherCreated = useCallback(
    (teacher: any) => {
      console.log(teacher.name);

      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Teacher",
      //   message: ` ${teacher.lastName} ${teacher.firstName} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.evict({ fieldName: "teachersTable" });
      apolloClient.cache.gc();
    },
    [apolloClient, addNotification]
  );

  const handleTeacherUpdated = useCallback(
    (teacher: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Teacher",
      //   message: ` ${teacher.lastName} ${teacher.firstName} updated`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.evict({ fieldName: "teachersTable" });
      apolloClient.cache.gc();
    },
    [apolloClient, addNotification]
  );

  // =========================
  // 🔹 GROUP SUBSCRIPTIONS
  // =========================
  const { isConnected: groupConnected, error: groupError } =
    useGroupSubscriptions({
      onGroupCreated: handleGroupCreated,
      onGroupUpdated: handleGroupUpdated,
      enabled: true,
    });

  const { isConnected: teacherConnected, error: teacherError } =
    useTeacherSubscriptions({
      onTeacherCreated: handleTeacherCreated,
      onTeacherUpdated: handleTeacherUpdated,
      enabled: true,
    });

  const handleStudentCreated = useCallback(
    (student: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Student",
      //   message: ` ${student.firstName} ${student.lastName} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.evict({ fieldName: "studentsTable" });
      apolloClient.cache.gc();
    },
    [apolloClient, addNotification]
  );

  // =========================
  // 🔹 WITHDRAW SUBSCRIPTIONS
  // =========================
  const handleWithDrawCreated = useCallback(
    (withdraw: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Withdraw",
      //   message: `${withdraw.amount} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.evict({
        fieldName: "withdraws",
      });

      apolloClient.cache.gc();
    },
    [apolloClient, addNotification]
  );

  const handleWithDrawUpdated = useCallback(
    (withdraw: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "WithDraw",
      //   message: ` ${withdraw.name} with amount of ${withdraw.amount} updated`,
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

  // ===============================
  // 🔹 WITHDRAW TYPE SUBSCRIPTIONS
  // ==============================
  const handleWithDrawTypeCreated = useCallback(
    (withdrawtype: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Withdraw type",
      //   message: `${withdrawtype.amount} created`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      apolloClient.cache.evict({
        fieldName: "withdrawTypes",
      });

      apolloClient.cache.gc();
    },
    [apolloClient, addNotification]
  );

  const handleWithDrawTypeUpdated = useCallback(
    (withdrawtype: any) => {
      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "WithDraw",
      //   message: ` ${withdrawtype.name} with amount of ${withdrawtype.amount} updated`,
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
  const { isConnected: withDrawConnected, error: withDrawError } =
    useWithDrawSubscriptions({
      onWithDrawCreated: handleWithDrawCreated,
      onWithDrawUpdated: handleWithDrawUpdated,
      enabled: true,
    });
  const { isConnected: withdrawtypeConnected, error: withdrawtypeError } =
    useWithDrawTypeSubscriptions({
      withDrawtypeCreated: handleWithDrawTypeCreated,
      withDrawtypeUpdated: handleWithDrawTypeUpdated,
      enabled: true,
    });
  const { isConnected: recitaionConnected, error: recitaionError } =
    useRecitaionSubscriptions({
      onRecitationCreated: handleRecitaionCreated,
      onRecitationUpdated: handleRecitaionUpdated,
      enabled: true,
    });
  const { isConnected: hifdhConnected, error: hifdhError } =
    useHifdhSubscriptions({
      onHifdhCreated: handleHifdhCreated,
      onHifdhUpdated: handleHifdhUpdated,
      enabled: true,
    });

  const { isConnected: attendacesConnected, error: attendacesError } =
    useAttendanceRealtime({
      onAttendanceUpdate: handleAttendancesUpdated,
    });
  const { isConnected: classRoomConnected, error: classroomError } =
    useClassroomSubscriptions({
      onClassroomCreated: handleClassroomCreated,
      onClassroomUpdated: handleClassroomUpdated,
      enabled: true,
    });

  const { isConnected: subjectConnected, error: subjectError } =
    useSubjectSubscriptions({
      onSubjectCreated: handleSubjectCreated,
      onSubjectUpdated: handleSubjectUpdated,
      enabled: true,
    });
  const handleStudentUpdated = useCallback(
    (student: any) => {
      console.log("Student updated event received:", student);

      if (!student?.id) {
        console.warn("Received student updated payload without ID:", student);
        return;
      }

      // addNotification({
      //   id: crypto.randomUUID(),
      //   title: "Student",
      //   message: `${student.firstName || "Student"} ${
      //     student.lastName || ""
      //   } updated`,
      //   createdAt: new Date(),
      //   read: false,
      // });

      // Safely map enrollments ensuring __typename is present for Apollo normalization
      const formattedEnrollments = student.enroll?.map((e: any) => ({
        __typename: "CourseEnrollment", // Ensure this matches your GraphQL schema typename
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
        console.log("Cache successfully updated for student:", student.id);
      } catch (error) {
        console.error("Apollo writeFragment failed:", error);
      }
    },
    [apolloClient, addNotification]
  );
  const { isConnected: studentConnected, error: studentError } =
    useStudentSubscriptions({
      onStudentCreated: handleStudentCreated,
      onStudentUpdated: handleStudentUpdated,
      enabled: true,
    });
  // =========================
  // 🔹 GLOBAL STATE
  // =========================
  const isSubscriptionsActive =
    groupConnected &&
    teacherConnected &&
    studentConnected &&
    subjectConnected &&
    classRoomConnected &&
    attendacesConnected &&
    recitaionConnected &&
    withdrawtypeConnected &&
    hifdhConnected;
  withDrawConnected;

  const subscriptionError =
    groupError ||
    teacherError ||
    studentError ||
    subjectError ||
    withDrawError ||
    attendacesError ||
    recitaionError ||
    withdrawtypeError ||
    hifdhError ||
    classroomError;

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscriptionsActive,
        subscriptionError,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access global subscription status
 */
export function useSubscriptionStatus() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscriptionStatus must be used within SubscriptionProvider"
    );
  }
  return context;
}
