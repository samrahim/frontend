import React, { useState, useEffect, useRef } from "react";
import { Box, Input, Label, Text } from "theme-ui";
import { useTranslation } from "react-i18next";

interface Teacher {
  id: string;
  name: string;
}

interface TeacherSelectProps {
  teachers: Teacher[];
  selectedTeacherId?: string;
  onSelectTeacher: (teacher: Teacher | null) => void;
}

export function TeacherSelectInput({
  teachers = [],
  selectedTeacherId,
  onSelectTeacher,
}: TeacherSelectProps) {
  const { t } = useTranslation();
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Refs for auto-scrolling during keyboard navigation
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  // Sync selected teacher name to input field
  useEffect(() => {
    if (selectedTeacherId) {
      const selected = teachers.find((t) => t.id === selectedTeacherId);
      if (selected) {
        setTeacherSearch(selected.name);
      }
    }
  }, [selectedTeacherId, teachers]);

  // 📜 Scroll highlighted element into view automatically
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  const handleSelectTeacher = (teacher: Teacher) => {
    setTeacherSearch(teacher.name);
    setShowTeacherDropdown(false);
    setHighlightedIndex(-1);
    onSelectTeacher(teacher);
  };

  const handleTeacherSearch = (value: string) => {
    setTeacherSearch(value);
    setShowTeacherDropdown(true);
    setHighlightedIndex(-1);
    if (!value) {
      onSelectTeacher(null);
    }
  };

  // ⌨️ Keyboard Navigation Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showTeacherDropdown || filteredTeachers.length === 0) {
      if (e.key === "ArrowDown") {
        setShowTeacherDropdown(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredTeachers.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredTeachers.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredTeachers.length
        ) {
          handleSelectTeacher(filteredTeachers[highlightedIndex]);
        }
        break;

      case "Escape":
        setShowTeacherDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <Box sx={{ flex: 1, position: "relative" }}>
      <Label
        htmlFor="teacher"
        sx={{ display: "block", mb: 2, fontWeight: "bold" }}
      >
        {t("recitation.teacher")}
      </Label>

      <Box sx={{ position: "relative" }}>
        {/* Input Field */}
        <Input
          id="teacher"
          placeholder={t("common.searchPlaceholder")}
          value={teacherSearch}
          onChange={(e) => handleTeacherSearch(e.target.value)}
          onFocus={() => setShowTeacherDropdown(true)}
          onKeyDown={handleKeyDown}
          sx={{
            width: "100%",
            p: 2,
            borderRadius: "base",
            border: "1px solid",
            borderColor: "border",
            bg: "background",
            color: "text",
            "&:focus": {
              outline: "none",
              borderColor: "primary",
              boxShadow: "0 0 0 3px rgba(0, 120, 212, 0.25)",
            },
          }}
        />

        {/* Dropdown Options List */}
        {showTeacherDropdown && filteredTeachers.length > 0 && (
          <Box
            ref={listRef}
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              bg: "background", // Dark mode safe theme color
              border: "1px solid",
              borderColor: "border",
              borderTop: "none",
              borderRadius: "0 0 base base",
              p: 0,
              maxHeight: "250px",
              overflowY: "auto",
              zIndex: 10,
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {filteredTeachers.map((teacher, index) => {
              const isHighlighted = index === highlightedIndex;

              return (
                <Box
                  key={teacher.id}
                  ref={(el) => (itemRefs.current[index] = el)}
                  onClick={() => handleSelectTeacher(teacher)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    bg: isHighlighted ? "muted" : "transparent",
                    color: "text",
                    borderBottom: "1px solid",
                    borderColor: "border",
                    transition: "background 0.15s ease",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <Text>{teacher.name}</Text>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Empty State / No Results */}
        {showTeacherDropdown &&
          filteredTeachers.length === 0 &&
          teacherSearch && (
            <Box
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                bg: "background",
                border: "1px solid",
                borderColor: "border",
                borderTop: "none",
                borderRadius: "0 0 base base",
                p: 2,
                textAlign: "center",
                color: "text",
                opacity: 0.7,
                zIndex: 10,
              }}
            >
              {t("common.noResults")}
            </Box>
          )}

        {/* Invisible Overlay to Close Dropdown On Outside Click */}
        {showTeacherDropdown && (
          <Box
            onClick={() => {
              setShowTeacherDropdown(false);
              setHighlightedIndex(-1);
            }}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9,
            }}
          />
        )}
      </Box>
    </Box>
  );
}
