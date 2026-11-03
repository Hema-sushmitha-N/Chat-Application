// Delivery status of a one-to-one message. It only ever moves forward:
// sent (saved) -> delivered (the receiver's app has it) -> read (the receiver opened the chat)
export const STATUS_ORDER = ['sent', 'delivered', 'read'];

export function statusRank(status) {
  return STATUS_ORDER.indexOf(status);
}

// True when moving from one status to the other is a step forward
export function canAdvance(from, to) {
  const a = statusRank(from);
  const b = statusRank(to);
  return a >= 0 && b > a;
}

// [{ _id, sender }, ...] -> { [senderId]: [messageId, ...] }
// Used to tell each sender which of their messages changed status.
export function groupIdsBySender(messages) {
  const groups = {};
  for (const m of messages) {
    const sender = String(m.sender);
    if (!groups[sender]) groups[sender] = [];
    groups[sender].push(String(m._id));
  }
  return groups;
}
