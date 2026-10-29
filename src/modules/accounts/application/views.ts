import type { User } from '../domain/user.js';

// Plain data for callers. Note what is missing: the password hash never
// leaves the module.
export interface UserView {
  id: string;
  email: string;
  createdAt: Date;
}

export function toUserView(user: User): UserView {
  return { id: user.id, email: user.email.value, createdAt: user.createdAt };
}
