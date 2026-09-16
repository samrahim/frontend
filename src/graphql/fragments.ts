import { gql } from "@apollo/client";

// Basic fragments
export const CREATOR_FRAGMENT = gql`
  fragment Creator on User {
    id
    firstName
    lastName
  }
`;

export const SUBJECT_FRAGMENT = gql`
  fragment SubjectFragment on Subject {
    id
    name
    createdAt
    updatedAt
    creator {
      ...Creator
    }
  }
  ${CREATOR_FRAGMENT}
`;

export const STUDENT_FRAGMENT = gql`
  fragment Std on Student {
    id
    firstName
    lastName
  }
`;

export const TEACHER_FRAGMENT = gql`
  fragment Tcr on Teacher {
    id
    firstName
    lastName
  }
`;

export const CHAUFFEUR_FRAGMENT = gql`
  fragment ChauffeurFrg on Chauffeur {
    id
    firstName
    lastName
  }
`;

export const STUDENT_DISPONIBILITY_FRAGMENT = gql`
  fragment StudentDisponibilityFragment on StudentDisponibility {
    id
    label
  }
`;

// Complex fragments
export const TEACHING_ASSIGNMENT_FRAGMENT = gql`
  fragment TeachingAssignmentFields on TeachingAssignment {
    id
    billingUnit
    pricePerUnit
    assignedAt
    stoppedAt
    assignedBy {
      ...Creator
    }
    stoppedBy {
      ...Creator
    }
    teacher {
      ...Tcr
      picture
    }
    subject {
      id
      name
    }
  }
  ${CREATOR_FRAGMENT}
  ${TEACHER_FRAGMENT}
`;

export const GROUP_BASIC_INFO_FRAGMENT = gql`
  fragment GroupBasicInfo on Group {
    id
    expected
    expectedTotal
    deposit
    rest
    name
    createdAt
    color
    pricePerUnit
    billingUnit
    invoiceThreshold
    blockStudents
    billingCycle
    trackBilling
    hourlyVolume
  }
`;

export const COURSE_ENROLLMENT_FRAGMENT = gql`
  fragment CourseEnrollmentFields on CourseEnrollment {
    id
    startAt
    endAt
    stopped
    discount
    student {
      ...Std
      picture
    }
    invoices {
      id
      amountPaid
      amountDue
      createdAt
      paidDate
      student {
        ...Std
      }
      transactions {
        id
        amount
        type
      }
    }
  }
  ${STUDENT_FRAGMENT}
`;

export const TEACHER_FIELDS_FRAGMENT = gql`
  fragment TeacherFields on Teacher {
    id
    firstName
    lastName
    createdAt
    updatedAt
    phone
    email
    picture
    creator {
      id
      firstName
      lastName
    }
  }
`;

export const STUDENT_PERSONAL_INFO_FRAGMENT = gql`
  fragment StudentPersonalInfo on Student {
    id
    firstName
    lastName
    email
    address
    phone
    dateOfBirth
    gender
    picture
    active
    banned
    createdAt
    updatedAt
    activatedAt
    creator {
      ...Creator
    }
    activatedBy {
      ...Creator
    }
  }
  ${CREATOR_FRAGMENT}
`;

export const STUDENT_PARENT_INFO_FRAGMENT = gql`
  fragment StudentParentInfo on Parent {
    id
    firstName
    lastName
    phones
    familyMember
  }
`;

export const STUDENT_SCHOLAR_INFO_FRAGMENT = gql`
  fragment StudentScholarInfo on Student {
    level
    subjects {
      ...SubjectFragment
    }
    disponible {
      ...StudentDisponibilityFragment
    }
  }
  ${SUBJECT_FRAGMENT}
  ${STUDENT_DISPONIBILITY_FRAGMENT}
`;

export const STUDENT_ADDITIONAL_INFO_FRAGMENT = gql`
  fragment StudentAdditionalInfo on Student {
    description
    note
    isSick
    healthNote
    transportEnabled
    cateringEnabled
    catering {
      id
      payed
      fees
      createdAt
      updatedAt
      stoppedAt
      stoppedBy {
        ...Creator
      }
      creator {
        ...Creator
      }
    }
  }
  ${CREATOR_FRAGMENT}
`;

export const USER_DETAILS_FRAGMENT = gql`
  fragment UserDetails on User {
    id
    createdAt
    updatedAt
    firstName
    lastName
    address
    email
    phone
    dateOfBirth
    description
    picture
    gender
    role
    active
    banned
    connected
    lastLogin
  }
`;

export const WITHDRAW_FIELDS_FRAGMENT = gql`
  fragment WithdrawFields on Withdraw {
    id
    note
    amount
    createdAt
    creator {
      ...Creator
    }
    type {
      id
      name
    }
  }
  ${CREATOR_FRAGMENT}
`;

export const TAG_FRAGMENT = gql`
  fragment TagFrag on Tag {
    id
    name
    color
  }
`;

export const TODO_FRAGMENT = gql`
  fragment TodoFrag on Todo {
    id
    title
    description
    createdAt
    priority
    sortOrder
    hidden
    tags {
      ...TagFrag
    }
    creator {
      ...Creator
      picture
    }
    assignee {
      ...Creator
      picture
    }
  }
  ${TAG_FRAGMENT}
  ${CREATOR_FRAGMENT}
`;

export const MESSAGE_FIELDS_FRAGMENT = gql`
  fragment MessageFields on Message {
    id
    createdAt
    sentAt
    deliveredAt
    deletedAt
    seenAt
    updatedAt
    height
    text
    name
    type
    mimeType
    uri
    uuid
    status
    size
    width
    room
    author {
      id
      firstName
      lastName
      picture
    }
  }
`;

export const GRADE_FIELDS_FRAGMENT = gql`
  fragment GradeFields on Grade {
    id
    name
    createdAt
    updatedAt
    creator {
      ...Creator
    }
  }
  ${CREATOR_FRAGMENT}
`;

export const GROUP_TYPE_FIELDS_FRAGMENT = gql`
  fragment GroupTypeFields on GroupType {
    id
    label
    createdAt
    updatedAt
    creator {
      ...Creator
    }
  }
  ${CREATOR_FRAGMENT}
`;

export const CLASSROOM_FIELDS_FRAGMENT = gql`
  fragment ClassroomFields on ClassRoom {
    id
    name
    color
    qty
  }
`;

export const STUDENT_TABLE_FIELDS_FRAGMENT = gql`
  fragment StudentTableFields on Student {
    id
    firstName
    lastName
    createdAt
    picture
    email
    phone
    creator {
      ...Creator
    }
  }
  ${CREATOR_FRAGMENT}
`;

export const BASIC_INFO_FIELDS_FRAGMENT = gql`
  fragment BasicInfoFields on Info {
    id
    uid
    name
    address
    email
    phones
    logo
    website
    currency
    autoGradePromotion
    workWeekDays
    schoolWorkStartTime
    schoolWorkEndTime
  }
`;

export const HOLIDAY_FIELDS_FRAGMENT = gql`
  fragment HolidayFields on Holiday {
    id
    name
    date
    isWorkingDay
  }
`;

export const PORTAL_SETTINGS_FIELDS_FRAGMENT = gql`
  fragment PortalSettingsFields on PortalSettings {
    id
    enableParentPortal
    enableTeacherPortal
    enableStudentPortal
  }
`;

export const CATERING_SERVICE_FIELDS_FRAGMENT = gql`
  fragment CateringServiceFields on CateringService {
    id
    cateringFeesRequired
    cateringSubscriptionFees
    cateringBillingPricePerUnit
    cateringBillingThreshold
    cateringBillingUnit
  }
`;

export const TRANSPORT_SERVICE_FIELDS_FRAGMENT = gql`
  fragment TransportServiceFields on TransportService {
    id
    transportFeesRequired
    transportSubscriptionFees
    transportBillingPricePerUnit
    transportBillingThreshold
    transportBillingUnit
  }
`;

export const NOTIFICATION_SETTINGS_FIELDS_FRAGMENT = gql`
  fragment NotificationSettingsFields on NotificationSettings {
    id
    notifySessionCreated
    notifySessionStarted
    notifySessionEnded
    notifySessionCanceled
    notifySessionRescheduled
    notifyLateAttendanceStudent
    notifyLateAttendanceParent
    notifyParentOnAbsence
    notifyAdminOnPaymentIssue
    sessionReminderMinutesBefore
    enableSystemAlerts
    notifyOnStudentScan
    notifyUpcomingExams
    notifyFeeDue
    enableEmergencyAlerts
    enableSmsNotifications
    enableEmailNotifications
    enablePushNotifications
    enableAnonymousFeedback
    enableDigitalReportCards
  }
`;

export const ATTENDANCE_SETTINGS_FIELDS_FRAGMENT = gql`
  fragment AttendanceSettingsFields on AttendanceSettings {
    id
    defaultAttendancePresent
    absentSessionsThreshold
    lateAttendanceThresholdSeconds
    minimumAttendancePercentage
    trackAttendanceOnWeekends
    maxAbsencesPerTerm
    enableStudentSelfCheckin
  }
`;

export const INFO_FIELDS_FRAGMENT = gql`
  fragment InfoFields on Info {
    ...BasicInfoFields
    holidays {
      ...HolidayFields
    }
    attendanceSettings {
      ...AttendanceSettingsFields
    }
  }
  ${BASIC_INFO_FIELDS_FRAGMENT}
  ${HOLIDAY_FIELDS_FRAGMENT}
  ${ATTENDANCE_SETTINGS_FIELDS_FRAGMENT}
`;

export const SESSION_FRAGMENT = gql`
  fragment SessionFragment on Session {
    id
    startAt
    endAt
    canceled
    free
    schedule {
      subject {
        id
        name
      }
      group {
        id
        name
        color
      }
    }
    class {
      id
      name
      color
    }
  }
`;

export const ANNOUNCEMENT_FRAGMENT = gql`
  fragment AnnouncementFragment on Announcement {
    id
    title
    content
    target
    createdAt
    updatedAt
    deletedAt
    creator {
      ...Creator
    }
  }
  ${CREATOR_FRAGMENT}
`;

export const ROUTE_FRAGMENT = gql`
  fragment RouteFrg on Route {
    id
    createdAt
    updatedAt
    name
    stops {
      id
      sequence
      address
      lat
      lng
      active
      addedAt
      stoppedAt
      student {
        id
        firstName
        lastName
        address
      }
      addedBy {
        id
        firstName
        lastName
      }
    }
    driver {
      ...ChauffeurFrg
      picture
    }
    vehicle {
      id
      licensePlate
      make
      model
      capacity
      year
      status
    }
    creator {
      ...Creator
    }
  }
  ${CHAUFFEUR_FRAGMENT}
  ${CREATOR_FRAGMENT}
`;
