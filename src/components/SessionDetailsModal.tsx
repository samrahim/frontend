import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Timepicker } from "timepicker-ui-react";

import {
  useChangeSessionStatusMutation,
  useRescheduleSessionMutation,
  useChangeSessionClassroomMutation,
  useGenerateSessionMeetingLinkMutation,
  useGetClassRoomsQuery,
} from "../graphql/generated";
import "./SessionDetailsModal.css";

interface SessionDetailsModalProps {
  session: any;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Extracts raw HH:mm string directly from ISO response without timezone conversion
 */
const extractLiteralTime = (isoStr?: string) => {
  if (!isoStr) return "";
  const match = isoStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
};

/**
 * Extracts raw YYYY-MM-DD string directly from ISO response without timezone conversion
 */
const extractLiteralDate = (isoStr?: string) => {
  if (!isoStr) return "";
  const match = isoStr.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
};

/**
 * Formats ISO string into a human-readable format keeping literal server values
 */
const formatLiteralDateTime = (isoStr?: string) => {
  if (!isoStr) return "N/A";
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return isoStr;

  const [, year, month, day, hours, minutes] = match;

  // Format as: "YYYY-MM-DD, HH:mm"
  return `${year}-${month}-${day}, ${hours}:${minutes}`;
};

export function SessionDetailsModal({
  session,
  isOpen,
  onClose,
}: SessionDetailsModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showConfirmation, setShowConfirmation] = useState<
    "cancel" | "reschedule" | "room" | null
  >(null);

  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    startTime: "",
    endTime: "",
  });

  // Reset/Initialize reschedule state cleanly whenever confirmation modal opens
  useEffect(() => {
    if (session && showConfirmation === "reschedule") {
      setRescheduleData({
        date: extractLiteralDate(session?.startAt),
        startTime: extractLiteralTime(session?.startAt),
        endTime: extractLiteralTime(session?.endAt),
      });
    }
  }, [session, showConfirmation]);

  const [selectedRoomId, setSelectedRoomId] = useState("");

  // Mutations
  const [changeSessionStatus, { loading: cancelLoading }] =
    useChangeSessionStatusMutation();
  const [rescheduleSession, { loading: rescheduleLoading }] =
    useRescheduleSessionMutation();
  const [changeSessionClassroom, { loading: roomLoading }] =
    useChangeSessionClassroomMutation();
  const [generateSessionMeetingLink, { loading: meetingLinkLoading }] =
    useGenerateSessionMeetingLinkMutation();

  // Fetch classrooms
  const { data: classroomsData } = useGetClassRoomsQuery({
    variables: {
      first: 100,
    },
  });

  const classrooms = useMemo(() => {
    return (
      classroomsData?.classRooms?.edges?.map((e) => e?.node).filter(Boolean) ||
      []
    );
  }, [classroomsData]);

  if (!isOpen || !session) {
    return null;
  }

  const handleCancel = async () => {
    try {
      await changeSessionStatus({
        variables: {
          id: session.id,
          cancel: true,
        },
      });
      setShowConfirmation(null);
      onClose();
    } catch (error) {
      console.error("Error canceling session:", error);
      alert(t("common.errorOccurred"));
    }
  };

  const handleReschedule = async () => {
    // Grab HTML input element created by the Timepicker
    const startInputEl =
      (document.querySelector(
        "#rescheduleStartTime input"
      ) as HTMLInputElement) ||
      (document.getElementById("rescheduleStartTime") as HTMLInputElement);

    const endInputEl =
      (document.querySelector(
        "#rescheduleEndTime input"
      ) as HTMLInputElement) ||
      (document.getElementById("rescheduleEndTime") as HTMLInputElement);

    const startTimeRaw = startInputEl?.value || rescheduleData.startTime;
    const endTimeRaw = endInputEl?.value || rescheduleData.endTime;
    const date = rescheduleData.date;

    try {
      if (!date || !startTimeRaw || !endTimeRaw) {
        alert(t("session.fillAllFields") || "Please fill all required fields");
        return;
      }

      const parseTimeString = (timeStr: string) => {
        const cleanTime = timeStr.trim();
        const isPM = /pm/i.test(cleanTime);
        const isAM = /am/i.test(cleanTime);

        const timeWithoutPeriod = cleanTime.replace(/(am|pm)/i, "").trim();
        const parts = timeWithoutPeriod.split(":");

        if (parts.length < 2) {
          throw new Error(`Invalid time format: ${timeStr}`);
        }

        let hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);

        if (isNaN(hours) || isNaN(minutes)) {
          throw new Error(`Invalid time format: ${timeStr}`);
        }

        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;

        const pad = (num: number) => String(num).padStart(2, "0");
        return `${pad(hours)}:${pad(minutes)}:00`;
      };

      const startFormatted = parseTimeString(startTimeRaw);
      const endFormatted = parseTimeString(endTimeRaw);

      // Build RFC3339 formatted strings directly without JavaScript Date/toISOString conversion
      const startAt = `${date}T${startFormatted}.000000Z`;
      const endAt = `${date}T${endFormatted}.000000Z`;

      await rescheduleSession({
        variables: {
          id: session.id,
          startAt,
          endAt,
        },
      });

      setShowConfirmation(null);
      onClose();
    } catch (error) {
      console.error("Error rescheduling session:", error);
      alert(t("common.errorOccurred"));
    }
  };

  const handleGroupDetails = () => {
    if (session.schedule?.group?.id) {
      onClose();
      navigate(`/groups/${session.schedule.group.id}`);
    }
  };

  const handleConnectToMeeting = () => {
    if (session.meetURL) {
      const meetingUrl = `https://meet.jit.si/${session.meetURL}`;
      window.open(meetingUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content session-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header">
            <h2 className="modal-title">{t("session.title")}</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {/* Session Info */}
            <div className="session-info">
              <div className="info-group">
                <label>{t("session.subject")}</label>
                <p>{session.schedule?.subject?.name || "N/A"}</p>
              </div>

              <div className="info-group">
                <label>{t("session.teacher")}</label>
                <p>
                  {`${session.schedule?.assignment?.teacher?.firstName || ""} ${
                    session.schedule?.assignment?.teacher?.lastName || ""
                  }`.trim() || "N/A"}
                </p>
              </div>

              <div className="info-group">
                <label>{t("session.group")}</label>
                <p>{session.schedule?.group?.name || "N/A"}</p>
              </div>

              <div className="info-group">
                <label>{t("session.startTime")}</label>
                <p>{formatLiteralDateTime(session.startAt)}</p>
              </div>

              <div className="info-group">
                <label>{t("session.endTime")}</label>
                <p>{formatLiteralDateTime(session.endAt)}</p>
              </div>

              <div className="info-group">
                <label>{t("session.duration")}</label>
                <p>
                  {session.durationMin} {t("session.minutes")}
                </p>
              </div>

              <div className="info-group">
                <label>{t("session.classroom")}</label>
                <p>
                  {session.schedule?.room?.name || t("session.notAssigned")}
                </p>
              </div>

              <div className="info-group">
                <label>{t("session.status")}</label>
                <p>
                  {session.canceled
                    ? t("session.canceled")
                    : t("session.active")}
                </p>
              </div>

              {session.meetURL && (
                <div className="info-group">
                  <label>{t("session.meetingRoomURL")}</label>
                  <p className="meeting-url">{session.meetURL}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              {session.meetURL && (
                <button
                  className="btn btn-success"
                  onClick={handleConnectToMeeting}
                >
                  {t("session.connectToMeeting")}
                </button>
              )}

              <button
                className="btn btn-primary"
                onClick={handleGroupDetails}
                disabled={!session.schedule?.group?.id}
              >
                {t("session.groupDetails")}
              </button>

              <button
                className="btn btn-warning"
                onClick={() => setShowConfirmation("reschedule")}
                disabled={session.canceled}
              >
                {t("session.reschedule")}
              </button>

              <button
                className="btn btn-danger"
                onClick={() => setShowConfirmation("cancel")}
                disabled={session.canceled}
              >
                {t("session.cancelSession")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showConfirmation === "cancel" && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmation(null)}
        >
          <div
            className="modal-content confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("session.cancelSessionConfirm")}</h3>
            <p>{t("session.cancelSessionMessage")}</p>
            <div className="confirmation-actions">
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={cancelLoading}
              >
                {cancelLoading
                  ? t("session.canceling")
                  : t("session.yesCancelButton")}
              </button>
              <button
                className="btn btn-default"
                onClick={() => setShowConfirmation(null)}
                disabled={cancelLoading}
              >
                {t("session.goBackButton")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Dialog */}
      {showConfirmation === "reschedule" && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmation(null)}
        >
          <div
            className="modal-content reschedule-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("session.rescheduleTitle")}</h3>

            <div className="form-group">
              <label>{t("session.date")}</label>
              <input
                type="date"
                value={rescheduleData.date}
                onChange={(e) =>
                  setRescheduleData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("session.startTime")}</label>
                <Timepicker
                  id="rescheduleStartTime"
                  placeholder="Select time"
                  options={{ clock: { type: "24h" } }}
                  value={rescheduleData.startTime}
                  onUpdate={(data: any) => {
                    const timeVal =
                      data?.formattedTime ||
                      data?.time ||
                      data?.formatted24 ||
                      "";
                    if (timeVal) {
                      setRescheduleData((prev) => ({
                        ...prev,
                        startTime: timeVal,
                      }));
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label>{t("session.endTime")}</label>
                <Timepicker
                  id="rescheduleEndTime"
                  placeholder="Select time"
                  options={{ clock: { type: "24h" } }}
                  value={rescheduleData.endTime}
                  onUpdate={(data: any) => {
                    const timeVal =
                      data?.formattedTime ||
                      data?.time ||
                      data?.formatted24 ||
                      "";
                    if (timeVal) {
                      setRescheduleData((prev) => ({
                        ...prev,
                        endTime: timeVal,
                      }));
                    }
                  }}
                />
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                className="btn btn-primary"
                onClick={handleReschedule}
                disabled={rescheduleLoading}
              >
                {rescheduleLoading
                  ? t("session.reschedule")
                  : t("session.confirmReschedule")}
              </button>
              <button
                className="btn btn-default"
                onClick={() => setShowConfirmation(null)}
                disabled={rescheduleLoading}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Room Dialog */}
      {showConfirmation === "room" && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmation(null)}
        >
          <div
            className="modal-content room-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("session.changeClassroom")}</h3>

            <div className="form-group">
              <label>{t("session.selectClassroom")}</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
              >
                <option value="">
                  {t("session.selectClassroomPlaceholder")}
                </option>
                {classrooms.map(
                  (room) =>
                    room && (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    )
                )}
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
