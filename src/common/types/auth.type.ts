export interface JwtPayload {
  sub: string; // userId
  email: string;
  permissions: string[];
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  permissions: string[];
}
