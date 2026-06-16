import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types/auth.types";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[]; // không truyền = chỉ cần đăng nhập
}

// BR-50: validate role, sai quyền → redirect /unauthorized
// BR-13: Staff không được vào Pricing → truyền allowedRoles={["MANAGER"]}
export default function RouteGuard({ children, allowedRoles }: Props) {
  const { isLoggedIn, user } = useAuthStore();

  if (!isLoggedIn || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
