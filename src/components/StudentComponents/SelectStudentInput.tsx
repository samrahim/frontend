import React, { useState, useEffect, useRef } from "react";
import { Box, Input, Label, Text, Badge, Flex, Button } from "theme-ui";
import {
  useStudentsTableQuery,
  OrderDirection,
  StudentOrderField,
} from "../../graphql/generated";

interface Student {
  id: string;
  name: string;
}

interface SelectStudentInputProps {
  /** Whether to allow multiple selections (default: false) */
  multiple?: boolean;
  /** Callback when selection changes */
  onChange: (value: string | string[]) => void;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
}

export function SelectStudentInput({
  multiple = false,
  onChange,
  label = "Select Student",
  placeholder = "Search student...",
  disabled = false,
}: SelectStudentInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Refs for managing automatic scrolling
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Debounced search term for performant GraphQL queries
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: studentsData } = useStudentsTableQuery({
    variables: {
      offset: 0,
      limit: 1000,
      orderBy: {
        direction: OrderDirection.Asc,
        field: StudentOrderField.FirstName,
      },
      where: debouncedSearch
        ? {
            or: [
              { firstNameContainsFold: debouncedSearch },
              { lastNameContainsFold: debouncedSearch },
            ],
          }
        : undefined,
      withTotalCount: false,
    },
  });

  const filteredStudents =
    studentsData?.studentsTable?.edges?.map((edge) => ({
      id: edge?.node?.id ?? "",
      name: `${edge?.node?.firstName ?? ""} ${edge?.node?.lastName ?? ""}`,
    })) ?? [];

  const selectedStudents = filteredStudents.filter((s) =>
    selectedIds.includes(s.id)
  );

  // 📜 Scroll selected element into view when navigating with keyboard
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  const handleSelectStudent = (student: Student) => {
    if (multiple) {
      const newValue = selectedIds.includes(student.id)
        ? selectedIds.filter((id) => id !== student.id)
        : [...selectedIds, student.id];
      setSelectedIds(newValue);
      onChange(newValue);
    } else {
      setSelectedIds([student.id]);
      onChange(student.id);
      setSearchTerm(student.name);
      setShowDropdown(false);
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    if (multiple) {
      const newValue = selectedIds.filter((id) => id !== studentId);
      setSelectedIds(newValue);
      onChange(newValue);
    }
  };

  // ⌨️ Keyboard Navigation Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredStudents.length === 0) {
      if (e.key === "ArrowDown") {
        setShowDropdown(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredStudents.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredStudents.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredStudents.length
        ) {
          handleSelectStudent(filteredStudents[highlightedIndex]);
        }
        break;

      case "Escape":
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {label && (
        <Label
          htmlFor="student-select"
          sx={{ display: "block", mb: 2, fontWeight: "bold" }}
        >
          {label}
        </Label>
      )}

      <Box sx={{ position: "relative" }}>
        {/* Input Field */}
        <Input
          id="student-select"
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          sx={{
            width: "100%",
            p: 2,
            borderRadius: "base",
            border: "1px solid",
            borderColor: "border",
            bg: disabled ? "muted" : "background",
            color: "text",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.6 : 1,
            "&:focus": {
              outline: "none",
              borderColor: "primary",
              boxShadow: "0 0 0 3px rgba(0, 120, 212, 0.25)",
            },
          }}
        />

        {/* Dropdown Container */}
        {showDropdown && filteredStudents.length > 0 && (
          <Box
            ref={listRef}
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
              maxHeight: "250px",
              overflowY: "auto",
              zIndex: 10,
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {filteredStudents.map((student, index) => {
              const isSelected = selectedIds.includes(student.id);
              const isHighlighted = index === highlightedIndex;

              return (
                <Box
                  key={student.id}
                  ref={(el) => (itemRefs.current[index] = el)}
                  onClick={() => handleSelectStudent(student)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    bg: isSelected
                      ? "primary"
                      : isHighlighted
                      ? "muted"
                      : "transparent",
                    color: isSelected ? "white" : "text",
                    borderBottom: "1px solid",
                    borderColor: "border",
                    transition: "background 0.15s ease",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <Text>{student.name}</Text>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Invisible Backdrop to Close Dropdown */}
        {showDropdown && (
          <Box
            onClick={() => {
              setShowDropdown(false);
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

      {/* Selected Badges (Multiple Mode) */}
      {multiple && selectedStudents.length > 0 && (
        <Flex sx={{ mt: 2, gap: 2, flexWrap: "wrap" }}>
          {selectedStudents.map((student) => (
            <Badge
              key={student.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: "6px 10px",
                bg: "primary",
                color: "white",
                borderRadius: "full",
                fontSize: 0,
                fontWeight: "bold",
              }}
            >
              {student.name}
              <Button
                onClick={() => handleRemoveStudent(student.id)}
                sx={{
                  bg: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  p: 0,
                  ml: 1,
                  fontSize: "16px",
                  lineHeight: "1",
                  "&:hover": { opacity: 0.8 },
                }}
              >
                ×
              </Button>
            </Badge>
          ))}
        </Flex>
      )}

      {/* Selected Badge (Single Mode) */}
      {!multiple && selectedStudents.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Badge sx={{ bg: "primary", color: "white" }}>
            {selectedStudents[0].name}
          </Badge>
        </Box>
      )}
    </Box>
  );
}
