import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Text } from "theme-ui";
import { keyframes } from "@emotion/react";
import { LuCircleStop, LuMic, LuRefreshCw } from "react-icons/lu";
import { t } from "i18next";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob | null) => void;
}

const bounceWaveform = keyframes`
  0% {
    transform: scaleY(0.2);
  }

  100% {
    transform: scaleY(1.2);
  }
`;

export const AudioRecorder = React.memo(function AudioRecorder({
  onRecordingComplete,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedURL, setRecordedURL] = useState("");

  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (recordedURL) {
      URL.revokeObjectURL(recordedURL);
    }

    setRecordedURL("");
    setSeconds(0);
    setIsRecording(true);
    onRecordingComplete(null);

    chunks.current = [];

    const getSupportedMimeType = () => {
      const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
        "audio/wav",
      ];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }
      return "";
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;

      const recorder = new MediaRecorder(stream, options);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearTimer();

        const blob = new Blob(chunks.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });

        const url = URL.createObjectURL(blob);

        setRecordedURL(url);
        onRecordingComplete(blob);

        chunks.current = [];
      };

      recorder.start();

      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);

      clearTimer();

      mediaStream.current?.getTracks().forEach((track) => {
        track.stop();
      });

      mediaStream.current = null;
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    clearTimer();

    setIsRecording(false);

    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
    }

    mediaStream.current?.getTracks().forEach((track) => {
      track.stop();
    });

    mediaStream.current = null;
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      clearTimer();

      mediaRecorder.current?.stop();

      mediaStream.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (recordedURL) {
        URL.revokeObjectURL(recordedURL);
      }
    };
  }, [recordedURL]);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Text
        sx={{
          fontSize: 0,
          fontWeight: "bold",
          letterSpacing: "wider",
          textTransform: "uppercase",
        }}
      >
        {t("recitation.audioRecording")}
      </Text>

      {/* Recording visualization */}
      <Box
        sx={{
          flex: 1,
          minHeight: "200px",
          border: "1px solid",
          borderColor: isRecording ? "#10B981" : "#E2E8F0",
          bg: isRecording
            ? "rgba(16, 185, 129, 0.02)"
            : "rgba(248, 250, 252, 0.5)",
          borderRadius: "lg",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          position: "relative",
        }}
      >
        {/* Waveform */}
        <Flex
          sx={{
            gap: "3px",
            alignItems: "center",
            mb: 3,
            height: "24px",
          }}
        >
          {Array.from({ length: 15 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                width: "3px",
                height: "100%",
                bg: isRecording ? "#ef4444" : "#10b981",
                borderRadius: "full",
                transformOrigin: "center",

                animation: isRecording
                  ? `${bounceWaveform} 0.6s ease-in-out infinite alternate`
                  : "none",

                animationDelay: `${i * 0.05}s`,

                transform: !isRecording
                  ? `scaleY(${0.2 + Math.abs(Math.sin(i * 0.6)) * 0.5})`
                  : undefined,
              }}
            />
          ))}
        </Flex>

        {/* Timer */}
        <Text
          sx={{
            fontSize: 5,
            fontWeight: "bold",
            color: isRecording ? "#10B981" : "text",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTimer(seconds)}
        </Text>

        <Text
          sx={{
            color: "muted",
            fontSize: 1,
            mt: 1,
          }}
        >
          {isRecording
            ? t("audio.recording")
            : recordedURL
            ? t("audio.recordingComplete")
            : t("audio.readyToRecord")}
        </Text>
      </Box>

      {/* Controls */}
      <Flex
        sx={{
          gap: 2,
          alignItems: "center",
          width: "100%",
        }}
      >
        {isRecording ? (
          <Button
            type="button"
            onClick={stopRecording}
            sx={{
              flex: 1,
              bg: "#EF4444",
              color: "white",
              py: 2,
              px: 3,
              borderRadius: "md",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              fontSize: 1,
              cursor: "pointer",

              "&:hover": {
                bg: "#DC2626",
              },
            }}
          >
            <LuCircleStop size={18} />
            {t("audio.stopRecording")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={startRecording}
            sx={{
              flex: 1,
              bg: recordedURL ? "white" : "primary",
              color: recordedURL ? "primary" : "white",
              border: recordedURL ? "1px solid" : "none",
              borderColor: "primary",
              py: 2,
              px: 3,
              borderRadius: "md",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              fontSize: 1,
              cursor: "pointer",

              "&:hover": {
                opacity: 0.9,
              },
            }}
          >
            {recordedURL ? (
              <>
                <LuRefreshCw size={18} />
                {t("audio.re-record")}
              </>
            ) : (
              <>
                <LuMic size={18} />
                {t("audio.startRecording")}
              </>
            )}
          </Button>
        )}
      </Flex>

      {/* Audio preview */}
      {recordedURL && (
        <Box sx={{ mt: 1 }}>
          <audio
            controls
            src={recordedURL}
            style={{
              width: "100%",
              borderRadius: "8px",
            }}
          />
        </Box>
      )}
    </Box>
  );
});
