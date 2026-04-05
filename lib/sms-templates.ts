// lib/sms-templates.ts
// Standardized SMS message templates for signpost
// All messages use "signpost" lowercase, no emoji, under 160 chars where possible

export const smsTemplates = {
  // Admin alerts
  newFlag: (interpreterName: string) =>
    `[signpost] Profile flagged: ${interpreterName}. Review at signpost.community/admin/dashboard/users`,

  paymentFailed: (bookingTitle: string) =>
    `[signpost] Payment failed: $15 fee for "${bookingTitle}". Review at signpost.community/admin/dashboard/bookings`,

  disputeOpened: (amount: string) =>
    `[signpost] Dispute opened: ${amount}. Respond in Stripe dashboard ASAP.`,

  // Booking notifications (interpreter-facing)
  newRequest: (date: string, time: string, location: string) =>
    `[signpost] New request: ${date}, ${time}, ${location}. Review at signpost.community/interpreter/dashboard/inquiries`,

  bookingConfirmed: (date: string, time: string, location: string) =>
    `[signpost] Confirmed: ${date}, ${time}, ${location}. Details at signpost.community/interpreter/dashboard/confirmed`,

  bookingCancelled: (date: string, time: string) =>
    `[signpost] Booking cancelled: ${date}, ${time}. Check signpost.community/interpreter/dashboard`,

  // Booking notifications (requester-facing)
  interpreterResponded: (interpreterName: string) =>
    `[signpost] ${interpreterName} responded to your request. Review at signpost.community/request/dashboard`,

  bookingConfirmedRequester: (interpreterName: string, date: string) =>
    `[signpost] Booking confirmed with ${interpreterName} on ${date}. Details at signpost.community/request/dashboard`,

  // Wave notifications (requester-facing)
  waveUrgent: (bookingTitle: string) =>
    `[signpost] Urgent: Your request "${bookingTitle}" is at risk. Send to more interpreters at signpost.community/request/dashboard`,

  // General
  newMessage: (senderName: string) =>
    `[signpost] New message from ${senderName}. Read at signpost.community`,
}
