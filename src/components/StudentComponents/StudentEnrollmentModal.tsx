import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  useStudentsTableQuery,
  useCreateBulkCourseEnrollmentsMutation,
  StudentWhereInput,
} from "../../graphql/generated";
import "./StudentEnrollmentModal.css";

interface StudentEnrollmentModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  enrolledStudentIds?: string[];
}

export function StudentEnrollmentModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
  enrolledStudentIds = [],
}: StudentEnrollmentModalProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);

  // Build where clause for search
  const buildWhereClause = useCallback((): StudentWhereInput | undefined => {
    if (!searchQuery.trim()) return undefined;

    const searchTerm = searchQuery.trim();
    return {
      or: [
        { firstNameContainsFold: searchTerm },
        { lastNameContainsFold: searchTerm },
        { emailContainsFold: searchTerm },
      ],
    };
  }, [searchQuery]);

  // Fetch students using StudentsTable query
  const { data: studentsData, loading: studentsLoading } =
    useStudentsTableQuery({
      variables: {
        offset: 0,
        limit: 10,
        where: buildWhereClause(),
        withTotalCount: true,
      },
      skip: !isOpen,
    });

  // Mutation for bulk enrollment
  const [createBulkEnrollments, { loading: enrollLoading }] =
    useCreateBulkCourseEnrollmentsMutation();

  // Filter students to exclude already enrolled
  const filteredStudents = useMemo(() => {
    if (!studentsData?.studentsTable?.edges) return [];

    return studentsData.studentsTable.edges
      .map((edge) => edge?.node)
      .filter(
        (student): student is NonNullable<typeof student> =>
          student !== null &&
          student !== undefined &&
          !enrolledStudentIds.includes(student.id)
      );
  }, [studentsData, enrolledStudentIds]);

  const handleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  }, [filteredStudents, selectedStudentIds.size]);

  const handleEnroll = async () => {
    if (selectedStudentIds.size === 0) {
      alert(
        t("enrollment.selectStudents") || "Please select at least one student"
      );
      return;
    }

    if (!startDate) {
      alert(t("enrollment.selectStartDate") || "Please select a start date");
      return;
    }

    try {
      // Convert dates to RFC3339Nano format
      const toRFC3339Nano = (dateString: string): string => {
        const date = new Date(`${dateString}T00:00:00`);
        const isoString = date.toISOString();
        return isoString.replace("Z", "000000Z");
      };

      const enrollmentInputs = Array.from(selectedStudentIds).map(
        (studentId) => ({
          groupID: groupId,
          studentID: studentId,
          startAt: toRFC3339Nano(startDate),
          endAt: endDate ? toRFC3339Nano(endDate) : undefined,
          discount: discount / 100, // Convert percentage to decimal
          creatorID: "1", // This should be the current user ID - adjust as needed
        })
      );

      await createBulkEnrollments({
        variables: {
          inputs: enrollmentInputs,
        },
      });

      // Reset form
      setSelectedStudentIds(new Set());
      setSearchQuery("");
      setDiscount(0);
      onSuccess?.();
      onClose();
      alert(t("enrollment.success") || "Students enrolled successfully!");
    } catch (error) {
      console.error("Error enrolling students:", error);
      alert(
        t("common.errorOccurred") ||
          "An error occurred while enrolling students"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content enrollment-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header">
            <h2 className="modal-title">Enroll Students</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body enrollment-body">
            {/* Enrollment Settings */}
            <div className="enrollment-settings">
              <div className="setting-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
              </div>

              <div className="setting-group">
                <label>End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>

              <div className="setting-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(
                      Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  className="number-input"
                />
              </div>
            </div>

            {/* Search Input */}
            <div className="search-container">
              <input
                type="text"
                placeholder={
                  t("enrollment.searchStudents") ||
                  "Search students by name or email..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Search Info */}
            <div className="search-info">
              {searchQuery.trim() ? (
                <span>
                  Showing search results for "<strong>{searchQuery}</strong>"
                </span>
              ) : (
                <span>Showing first 10 students • Search to find more</span>
              )}
            </div>

            {/* Select All Checkbox */}
            <div className="select-all-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    filteredStudents.length > 0 &&
                    selectedStudentIds.size === filteredStudents.length
                  }
                  onChange={handleSelectAll}
                  className="checkbox-input"
                />
                <span>
                  {filteredStudents.length > 0
                    ? `Select All (${filteredStudents.length})`
                    : "No students available"}
                </span>
              </label>
            </div>

            {/* Students List */}
            <div className="students-list">
              {studentsLoading ? (
                <div className="loading">Loading students...</div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div key={student.id} className="student-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="checkbox-input"
                      />
                      <span className="student-info">
                        <span className="student-name">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="student-email">{student.email}</span>
                      </span>
                    </label>
                  </div>
                ))
              ) : (
                <div className="no-students">
                  {enrolledStudentIds.length > 0
                    ? "All available students are already enrolled"
                    : "No students found"}
                </div>
              )}
            </div>

            {/* Selected Count */}
            <div className="selected-count">
              <strong>{selectedStudentIds.size}</strong> student(s) selected
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={enrollLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEnroll}
              disabled={selectedStudentIds.size === 0 || enrollLoading}
            >
              {enrollLoading
                ? "Enrolling..."
                : `Enroll ${selectedStudentIds.size} Student(s)`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
