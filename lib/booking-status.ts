/**
 * Shared booking status constants used across requester and interpreter dashboards.
 */

export const RECIPIENT_STATUS_ORDER: Record<string, number> = {
  confirmed: 0, responded: 1, proposed: 1, viewed: 2, sent: 3, declined: 4, withdrawn: 5,
}
