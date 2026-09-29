export const SESSION_COOKIE = "lms_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export const ROLES = ["employee", "admin"] as const;