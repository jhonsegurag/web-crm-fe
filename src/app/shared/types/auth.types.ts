export interface AuthUser {
  id: string;
  email: string;
  businessId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  businessName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
