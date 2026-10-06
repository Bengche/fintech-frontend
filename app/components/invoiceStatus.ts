// Maps an invoice status to its key under the "Invoice.list" translations.
export const STATUS_LABEL_KEY: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  partially_paid: "statusPartiallyPaid",
  delivered: "statusDelivered",
  completed: "statusCompleted",
  expired: "statusExpired",
  disputed: "statusDisputed",
};
