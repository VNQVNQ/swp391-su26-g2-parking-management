import axiosInstance from "./axiosInstance";

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export const getMyNotifications = async (): Promise<NotificationResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<NotificationResponse[]>>("/notifications");
  return response.data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await axiosInstance.get<ApiResponse<number>>("/notifications/unread-count");
  return response.data.data;
};

export const markAsRead = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await axiosInstance.patch("/notifications/read-all");
};
