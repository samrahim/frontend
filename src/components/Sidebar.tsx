import { Link, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  Sidebar as ProSidebar,
  Menu,
  MenuItem,
  sidebarClasses,
} from "react-pro-sidebar";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import theme from "../theme/theme";

interface NavItem {
  label: string;
  path: string;
  icon: string;
  translationKey: string;
  badgeCount?: number;
}

export function AppSidebar({}) {
  const NAV_ITEMS: NavItem[] = useMemo(
    () => [
      {
        label: "Dashboard",
        path: "/home",
        icon: "📊",
        translationKey: "navigation.dashboard",
      },
      {
        label: "Calendar",
        path: "/calendar",
        icon: "📅",
        translationKey: "navigation.calendar",
      },
      {
        label: "Students",
        path: "/students",
        icon: "👥",
        translationKey: "navigation.students",
      },
      {
        label: "Teachers",
        path: "/teachers",
        icon: "👨‍🏫",
        translationKey: "navigation.teachers",
      },
      {
        label: "Groups",
        path: "/groups",
        icon: "🕌",
        translationKey: "navigation.groups",
      },
      {
        label: "Recitation Tracking",
        path: "/recitation",
        icon: "🎙️",
        translationKey: "navigation.recitationTracking",
      },
      {
        label: "Hifdh Tracking",
        path: "/hifdh",
        icon: "📖",
        translationKey: "navigation.hifdhTracking",
      },
      {
        label: "Attendances",
        path: "/attendences",
        icon: "📋",
        translationKey: "navigation.attendances",
      },
      {
        label: "Attendance Approvals",
        path: "/attendanceapprovals",
        icon: "✅",
        translationKey: "navigation.attendanceApprovals",
      },
      {
        label: "Invoices",
        path: "/Invoicespage",
        icon: "🧾",
        translationKey: "navigation.invoices",
      },
      {
        label: "Withdraws",
        path: "/Withdraws",
        icon: "💰",
        translationKey: "navigation.withdraws",
      },
      {
        label: "Settings",
        path: "/settings",
        icon: "⚙️",
        translationKey: "navigation.settings",
      },
    ],
    []
  );

  const location = useLocation();

  const isActive = (path: string) => {
    const currentPath = location.pathname.toLowerCase();
    const itemPath = path.toLowerCase();

    // Exact match for root/home dashboard
    if (itemPath === "/home") {
      return currentPath === "/home";
    }

    // Match exact path or sub-routes for each menu item
    switch (itemPath) {
      case "/hifdh":
        return (
          currentPath.startsWith("/hifdh") ||
          currentPath.startsWith("/createhifdh")
        );

      case "/recitation":
        return (
          currentPath.startsWith("/recitation") ||
          currentPath.startsWith("/createrecitation")
        );

      case "/students":
        return (
          currentPath.startsWith("/students") ||
          currentPath.startsWith("/student/")
        );

      case "/teachers":
        return currentPath.startsWith("/teachers");

      case "/groups":
        return currentPath.startsWith("/groups");

      case "/attendences":
        return (
          currentPath.startsWith("/attendence") ||
          currentPath.startsWith("/attendance/")
        );

      case "/invoicespage":
        return (
          currentPath.startsWith("/invoicespage") ||
          currentPath.startsWith("/pay-invoice")
        );

      case "/withdraws":
        return currentPath.startsWith("/withdraws");

      default:
        return (
          currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
        );
    }
  };

  const { t } = useTranslation();

  const [collapse, setCollapse] = useState(() => window.innerWidth <= 400);

  useEffect(() => {
    const handleResize = () => {
      setCollapse(window.innerWidth <= 400);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ProSidebar
      collapsed={collapse}
      rootStyles={{
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        border: "none",
        width: "300px",
        [`.${sidebarClasses.container}`]: {
          background: `linear-gradient(180deg, ${theme.colors?.sidebarGradientStart} 0%, ${theme.colors?.sidebarGradientEnd} 100%)`,
        },
      }}
    >
      <Menu
        menuItemStyles={{
          button: ({ active }) => ({
            margin: "6px 12px",
            borderRadius: "12px",
            color: "white",
            backgroundColor: active ? "rgba(255,255,255,0.25)" : "transparent",
            borderLeft: active
              ? "4px solid rgba(255,255,255,.8)"
              : "4px solid transparent",
            borderRight: active
              ? "4px solid rgba(255,255,255,.8)"
              : "4px solid transparent",
            transition: "all .3s",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,.15)",
            },
            "&:focus, &:focus-visible": {
              outline: "none",
              boxShadow: "none",
            },
          }),
          icon: {
            color: "white",
            fontSize: "22px",
          },
          label: {
            color: "white",
            fontWeight: 500,
          },
        }}
      >
        <MenuItem>
          <LanguageSwitcher />
        </MenuItem>
        {NAV_ITEMS.map((item) => (
          <MenuItem
            key={item.path}
            active={isActive(item.path)}
            icon={item.icon}
            component={<Link to={item.path} replace />}
            suffix={
              Boolean(item.badgeCount) && item.badgeCount! > 0 ? (
                <span
                  style={{
                    backgroundColor: "#e53e3e",
                    color: "white",
                    borderRadius: "10px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    lineHeight: "1.2",
                  }}
                >
                  {item.badgeCount}
                </span>
              ) : null
            }
          >
            {t(item.translationKey)}
          </MenuItem>
        ))}
      </Menu>
    </ProSidebar>
  );
}
