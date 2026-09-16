import { useState, useEffect, useRef, useMemo } from "react";
import { useCreateParentMutation, useGetFamilyMembersQuery } from "../graphql";
import { useAuth } from "../contexts/AuthContext";
import { Box, Button, Input, Label, Flex, Text } from "theme-ui";
import { useTranslation } from "react-i18next";
import PhoneInputPkg from "react-phone-input-2";
const PhoneInput = (PhoneInputPkg as any).default || PhoneInputPkg;
import theme from "../theme/theme";

interface KinshipOption {
  id: string;
  name: string;
}

export function CreateParentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (parent: any) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    familyMemberID: "",
  });

  const { data: familyMembersData, loading: loadingFamilyMembers } =
    useGetFamilyMembersQuery({
      skip: !open,
    });

  // Safely map edges -> node data to match KinshipOption structure
  const rawKinships: KinshipOption[] = useMemo(() => {
    const edges = familyMembersData?.getfamilyMembers.edges || [];
    return edges
      .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge?.node))
      .map((edge) => ({
        id: edge.node!.id,
        name: edge.node!.type,
      }));
  }, [familyMembersData]);

  // Dropdown & Pagination states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedOptions, setDisplayedOptions] = useState<KinshipOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 5;

  const { user } = useAuth();
  const [createParent, { loading: savingParent }] = useCreateParentMutation();
  const bgColor = theme?.colors?.background || "#ffffff";
  const textColor = theme?.colors?.text || "#000000";

  // Filter & paginate options dynamically
  useEffect(() => {
    if (!isDropdownOpen) return;

    const filtered = rawKinships.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginated = filtered.slice(0, page * PAGE_SIZE);
    setDisplayedOptions(paginated);
    setHasMore(paginated.length < filtered.length);
  }, [searchQuery, page, rawKinships, isDropdownOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
    if (!isDropdownOpen) setIsDropdownOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10 && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.phone ||
      !form.familyMemberID
    ) {
      alert("All fields are required");
      return;
    }

    const { data } = await createParent({
      variables: {
        input: {
          firstName: form.firstName,
          lastName: form.lastName,
          phones: [form.phone],
          creatorID: String(user?.id),
          familyMemberID: form.familyMemberID,
        },
      },
    });

    if (data?.createParent) {
      onCreated(data.createParent);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        bg: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          bg: "background",
          p: 4,
          borderRadius: "lg",
          width: "400px",
          boxShadow: "lg",
        }}
      >
        <Text as="h3" sx={{ mb: 3, fontSize: 3, fontWeight: "heading" }}>
          Create Parent
        </Text>

        <Flex sx={{ flexDirection: "column", gap: 3 }}>
          <Box>
            <Label>First Name</Label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Box>

          <Box>
            <Label>Last Name</Label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Box>

          <Box>
            <Label htmlFor="phone" sx={{ fontWeight: "bold", mb: 2 }}>
              {t("students.phone")}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>
            <Box
              sx={{
                width: "100%",
                "& .react-tel-input": {
                  width: "100%",
                },
                "& .form-control": {
                  width: "100% !important",
                  height: "42px !important",
                  backgroundColor: `${bgColor} !important`,
                  color: `${textColor} !important`,
                  border: "1px solid !important",
                  borderColor: "border !important",
                  borderRadius: "6px !important",
                  fontSize: "16px !important",
                  paddingLeft: "58px !important",
                  transition: "all 0.2s",
                },
                "& .form-control:focus": {
                  borderColor: "primary !important",
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1) !important",
                  outline: "none !important",
                },
                "& .flag-dropdown": {
                  backgroundColor: `${bgColor} !important`,
                  borderColor: "border !important",
                  borderTopLeftRadius: "6px !important",
                  borderBottomLeftRadius: "6px !important",
                  borderRight: "1px solid !important",
                  borderRightColor: "border !important",
                },
                "& .selected-flag": {
                  backgroundColor: `${bgColor} !important`,
                  width: "48px !important",
                },
                "& .country-list": {
                  backgroundColor: `${bgColor} !important`,
                  color: `${textColor} !important`,
                  borderColor: "border !important",
                  borderRadius: "8px !important",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1) !important",
                },
                "& .country-list .country:hover": {
                  backgroundColor: "muted !important",
                },
              }}
            >
              <PhoneInput
                placeholder="6XX XXX XXX"
                country={"dz"}
                value={form.phone}
                onChange={(phone: any) =>
                  setForm({ ...form, phone: "+" + phone })
                }
                enableSearch={true}
              />
            </Box>
          </Box>

          {/* Searchable Paginated Kinship Dropdown */}
          <Box ref={dropdownRef} sx={{ position: "relative" }}>
            <Label htmlFor="kinship">{t("parents.kinship")}</Label>
            <Input
              id="kinship"
              placeholder="Search kinship..."
              value={isDropdownOpen ? searchQuery : selectedLabel}
              onFocus={() => {
                setIsDropdownOpen(true);
                setSearchQuery("");
                setPage(1);
              }}
              onChange={handleSearchChange}
              sx={{
                width: "100%",
                px: 2,
                py: 2,
                border: "1px solid",
                borderColor: "border",
                borderRadius: "6px",
                fontSize: 1,
                "&:focus": {
                  outline: "none",
                  borderColor: "primary",
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                },
              }}
            />

            {isDropdownOpen && (
              <Box
                onScroll={handleScroll}
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: "160px",
                  overflowY: "auto",
                  bg: "background",
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "6px",
                  mt: 1,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 10,
                }}
              >
                {loadingFamilyMembers && displayedOptions.length === 0 ? (
                  <Box
                    sx={{
                      p: 2,
                      color: "muted",
                      textAlign: "center",
                      fontSize: 1,
                    }}
                  >
                    Loading...
                  </Box>
                ) : displayedOptions.length === 0 ? (
                  <Box
                    sx={{
                      p: 2,
                      color: "muted",
                      textAlign: "center",
                      fontSize: 1,
                    }}
                  >
                    No items found
                  </Box>
                ) : (
                  displayedOptions.map((option) => (
                    <Box
                      key={option.id}
                      onClick={() => {
                        setForm({
                          ...form,
                          familyMemberID: option.id,
                        });
                        setSelectedLabel(option.name);
                        setIsDropdownOpen(false);
                      }}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        fontSize: 1,
                        bg:
                          form.familyMemberID === option.id
                            ? "muted"
                            : "transparent",
                        "&:hover": {
                          bg: "primary",
                          color: "white",
                        },
                      }}
                    >
                      {option.name}
                    </Box>
                  ))
                )}

                {hasMore && displayedOptions.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      textAlign: "center",
                      fontSize: 0,
                      color: "gray",
                    }}
                  >
                    Scroll down for more...
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Flex sx={{ gap: 2, mt: 3 }}>
            <Button onClick={handleSubmit} disabled={savingParent}>
              {savingParent ? "Saving..." : "Save"}
            </Button>

            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
