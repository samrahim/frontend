import React from "react";
import {
  BrowserRouter as Router,
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
// import SubjectsPage from "./pages/SubjectsPage";

import { CreateStudentPage } from "./pages/CreateStudentPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { NotificationProvider } from "./providers/NotificationProvider";
import { CreateRecitationPage } from "./components/CreateRecitation";
import { CreateHifdhPage } from "./components/CreateHifh";
import { CreateTeachertForm } from "./components/TeacherComponents/CreateTeacherForm";
import { WithdrawsPage } from "./pages/WithdrawPage";
import { RecitationDetails } from "./pages/RecitationDetails";
import { PayInvoicePage } from "./pages/PayInvoicePage";
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

Modal.setAppElement("#root");
function App() {
  // Set initial RTL/LTR based on i18n language
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
              {/* <SubscriptionProvider> */}
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
                        <StudentSubscriptionProvider>
                          <StudentsPage />
                        </StudentSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/attendanceapprovals"
                    element={
                      <ProtectedRoute>
                        <AttendanceSubscriptionProvider>
                          <AttendanceApprovalsPage />
                        </AttendanceSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/:id"
                    element={
                      <ProtectedRoute>
                        <StudentSubscriptionProvider>
                          <StudentDetailsPage />
                        </StudentSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/studentEnrollmentCard/:groupId/:studentId"
                    element={
                      <ProtectedRoute>
                        <StudentSubscriptionProvider>
                          <StudentEnrollmentCard />
                        </StudentSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/students/edit/:id"
                    element={
                      <ProtectedRoute>
                        <StudentSubscriptionProvider>
                          <StudentEditPage />
                        </StudentSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teachers"
                    element={
                      <ProtectedRoute>
                        <TeacherSubscriptionProvider>
                          <TeachersPage />
                        </TeacherSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teachers/edit/:id"
                    element={
                      <ProtectedRoute>
                        <TeacherSubscriptionProvider>
                          <TeacherEditPage />
                        </TeacherSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/createrecitation"
                    element={
                      <ProtectedRoute>
                        <AcademicSubscriptionProvider>
                          <CreateRecitationPage />
                        </AcademicSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/createhifdh"
                    element={
                      <ProtectedRoute>
                        <AcademicSubscriptionProvider>
                          <CreateHifdhPage />
                        </AcademicSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teachers/:id"
                    element={
                      <ProtectedRoute>
                        <TeacherSubscriptionProvider>
                          <TeacherDetailsPage />
                        </TeacherSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups"
                    element={
                      <ProtectedRoute>
                        <GroupSubscriptionProvider>
                          <GroupsPage />
                        </GroupSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teachers/create"
                    element={
                      <ProtectedRoute>
                        <TeacherSubscriptionProvider>
                          <CreateTeachertForm />
                        </TeacherSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/groups/:id"
                    element={
                      <ProtectedRoute>
                        <GroupSubscriptionProvider>
                          <GroupDetailsPage />
                        </GroupSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/attendences"
                    element={
                      <ProtectedRoute>
                        <AttendanceSubscriptionProvider>
                          <AttendancePage />
                        </AttendanceSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pay-invoice"
                    element={
                      <ProtectedRoute>
                        <FinanceSubscriptionProvider>
                          <PayInvoicePage />
                        </FinanceSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/groups/create"
                    element={
                      <ProtectedRoute>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <GroupSubscriptionProvider>
                            <CreateGroupPage />
                          </GroupSubscriptionProvider>
                        </LocalizationProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/Invoicespage"
                    element={
                      <ProtectedRoute>
                        <FinanceSubscriptionProvider>
                          <InvoicesPage />
                        </FinanceSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/create"
                    element={
                      <ProtectedRoute>
                        <StudentSubscriptionProvider>
                          <CreateStudentPage />
                        </StudentSubscriptionProvider>
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
                        <AcademicSubscriptionProvider>
                          <HifdhTracking />
                        </AcademicSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/withdraws"
                    element={
                      <ProtectedRoute>
                        <FinanceSubscriptionProvider>
                          <WithdrawsPage />
                        </FinanceSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/recitation"
                    element={
                      <ProtectedRoute>
                        <AcademicSubscriptionProvider>
                          <RecitationTracking />
                        </AcademicSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recitations/edit/:id"
                    element={
                      <ProtectedRoute>
                        <AcademicSubscriptionProvider>
                          <EditRecitationPage />
                        </AcademicSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/hifdhs/edit/:id"
                    element={
                      <ProtectedRoute>
                        <AcademicSubscriptionProvider>
                          <EditHifdhPage />
                        </AcademicSubscriptionProvider>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/recitations/:id"
                    element={
                      <ProtectedRoute>
                        <AcademicSubscriptionProvider>
                          <RecitationDetails />
                        </AcademicSubscriptionProvider>
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
                  <Route path="/" element={<Navigate to="/home" replace />} />
                </Routes>
              </Router>
              {/* </SubscriptionProvider> */}
            </NotificationProvider>
          </AuthProvider>
        </ApolloProvider>
      </ThemeUIProvider>
    </I18nextProvider>
  );
}

export default App;
