import { createContext } from "react";

export type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
};

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);
