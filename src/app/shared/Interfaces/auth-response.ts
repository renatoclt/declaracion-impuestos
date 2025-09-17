import { UserRole } from "../enum/user-role";

export interface AuthResponse {
  success: boolean;
  token?: string;
  role?: UserRole;
  message?: string;
}
