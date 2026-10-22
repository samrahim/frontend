import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ApolloProvider } from "@apollo/client";
import { I18nextProvider, useTranslation } from "react-i18next";
import { ThemeUIProvider } from "theme-ui";
import { AuthProvider } from "./contexts/AuthContext";

import { client } from "./lib/apolloClient";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import theme from "./theme/theme";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { StudentsPage } from "./pages/StudentsPage";
import StudentDetailsPage from "./pages/StudentDetailsPage";
import { TeachersPage } from "./pages/TeachersPage";
import TeacherDetailsPage from "./pages/TeacherDetailsPage";
import { GroupsPage } from "./pages/GroupsPage";
import { CreateGroupPage } from "./pages/CreateGroupPage";
import GroupDetailsPage from "./pages/GroupDetailsPage";
import { SettingsPage } from "./pages/SettingsPage";
import CalendarPage from "./pages/CalendarPage";
import { HifdhTracking } from "./pages/HifdhTracking";
import { RecitationTracking } from "./pages/RecitationTracking";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Modal from "react-modal";
import StudentEditPage from "./pages/EditStudentPage";
import AttendancePage from "./pages/AttendencePage";

import { CreateStudentPage } from "./pages/CreateStudentPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { NotificationProvider } from "./providers/NotificationProvider";
import { CreateRecitationPage } from "./components/CreateRecitation";
import { CreateHifdhPage } from "./components/CreateHifh";
import { CreateTeachertForm } from "./components/TeacherComponents/CreateTeacherForm";
import { WithdrawsPage } from "./pages/WithdrawPage";
import { RecitationDetails } from "./pages/RecitationDetails";

import TeacherEditPage from "./pages/EditTeacherPage";

import { EditRecitationPage } from "./pages/EditRecitaionPage";
import StudentEnrollmentCard from "./pages/StudentEnrollementCard";
import { AttendanceApprovalsPage } from "./pages/AttendanceApprovalsPage";
import { EditHifdhPage } from "./pages/EditHifdh";
import { AcademicSubscriptionProvider } from "./contexts/AcademicSubscriptionProvider";
import { FinanceSubscriptionProvider } from "./contexts/FinanceSubscriptionProvider";
import { StudentSubscriptionProvider } from "./contexts/StudentSubscriptionProvider";
import { GroupSubscriptionProvider } from "./contexts/GroupSubscriptionProvider";
import { TeacherSubscriptionProvider } from "./contexts/TeacherSubscriptionProvider";
import { AttendanceSubscriptionProvider } from "./contexts/AttendanceSubscriptionProvider";
import PayrollsScreen from "./pages/PayrollsPage";
import { PayrollDetails } from "./pages/PayrollDetails";
import { UpdateTeacherPayroll } from "./pages/EditPayrollPage";
import { PayrollSubscriptionProvider } from "./contexts/PayrollSubsciptionProvider";

Modal.setAppElement("#root");

function App() {
  const { i18n } = useTranslation();
  React.useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeUIProvider theme={theme}>
        <ApolloProvider client={client}>
          <AuthProvider>
            <NotificationProvider>
              {/* 🚀 Global Subscription Providers (Active app-wide to prevent WebSocket reconnects) */}
              <StudentSubscriptionProvider>
                <TeacherSubscriptionProvider>
                  <GroupSubscriptionProvider>
                    <AcademicSubscriptionProvider>
                      <FinanceSubscriptionProvider>
                        <AttendanceSubscriptionProvider>
                          <PayrollSubscriptionProvider>
                            <Router>
                              <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route
                                  path="/home"
                                  element={
                                    <ProtectedRoute>
                                      <HomePage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/students"
                                  element={
                                    <ProtectedRoute>
                                      <StudentsPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/attendanceapprovals"
                                  element={
                                    <ProtectedRoute>
                                      <AttendanceApprovalsPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/students/:id"
                                  element={
                                    <ProtectedRoute>
                                      <StudentDetailsPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/studentEnrollmentCard/:groupId/:studentId"
                                  element={
                                    <ProtectedRoute>
                                      <StudentEnrollmentCard />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/students/edit/:id"
                                  element={
                                    <ProtectedRoute>
                                      <StudentEditPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/teachers"
                                  element={
                                    <ProtectedRoute>
                                      <TeachersPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/teachers/edit/:id"
                                  element={
                                    <ProtectedRoute>
                                      <TeacherEditPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/createrecitation"
                                  element={
                                    <ProtectedRoute>
                                      <CreateRecitationPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/payrollsScreen"
                                  element={
                                    <ProtectedRoute>
                                      <PayrollsScreen />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/payroll/:id"
                                  element={
                                    <ProtectedRoute>
                                      <PayrollDetails />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/editpayroll/:id"
                                  element={
                                    <ProtectedRoute>
                                      <UpdateTeacherPayroll />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/createhifdh"
                                  element={
                                    <ProtectedRoute>
                                      <CreateHifdhPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/teachers/:id"
                                  element={
                                    <ProtectedRoute>
                                      <TeacherDetailsPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/groups"
                                  element={
                                    <ProtectedRoute>
                                      <GroupsPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/teachers/create"
                                  element={
                                    <ProtectedRoute>
                                      <CreateTeachertForm />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/groups/:id"
                                  element={
                                    <ProtectedRoute>
                                      <GroupDetailsPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/attendences"
                                  element={
                                    <ProtectedRoute>
                                      <AttendancePage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/groups/create"
                                  element={
                                    <ProtectedRoute>
                                      <LocalizationProvider
                                        dateAdapter={AdapterDayjs}
                                      >
                                        <CreateGroupPage />
                                      </LocalizationProvider>
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/Invoicespage"
                                  element={
                                    <ProtectedRoute>
                                      <InvoicesPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/student/create"
                                  element={
                                    <ProtectedRoute>
                                      <CreateStudentPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/calendar"
                                  element={
                                    <ProtectedRoute>
                                      <CalendarPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/hifdh"
                                  element={
                                    <ProtectedRoute>
                                      <HifdhTracking />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/withdraws"
                                  element={
                                    <ProtectedRoute>
                                      <WithdrawsPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/recitation"
                                  element={
                                    <ProtectedRoute>
                                      <RecitationTracking />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/recitations/edit/:id"
                                  element={
                                    <ProtectedRoute>
                                      <EditRecitationPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/hifdhs/edit/:id"
                                  element={
                                    <ProtectedRoute>
                                      <EditHifdhPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/recitations/:id"
                                  element={
                                    <ProtectedRoute>
                                      <RecitationDetails />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/settings"
                                  element={
                                    <ProtectedRoute>
                                      <SettingsPage />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route
                                  path="/"
                                  element={<Navigate to="/home" replace />}
                                />
                              </Routes>
                            </Router>
                          </PayrollSubscriptionProvider>
                        </AttendanceSubscriptionProvider>
                      </FinanceSubscriptionProvider>
                    </AcademicSubscriptionProvider>
                  </GroupSubscriptionProvider>
                </TeacherSubscriptionProvider>
              </StudentSubscriptionProvider>
            </NotificationProvider>
          </AuthProvider>
        </ApolloProvider>
      </ThemeUIProvider>
    </I18nextProvider>
  );
}

export default App;
