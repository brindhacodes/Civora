export const STATUS_STEPS = ["Submitted", "Assigned", "In Progress", "Resolved"];

export function normalizeStatus(status = "Submitted") {
  if (status === "Pending") return "Submitted";
  return STATUS_STEPS.includes(status) ? status : "Submitted";
}

export function statusIndex(status) {
  return Math.max(0, STATUS_STEPS.indexOf(normalizeStatus(status)));
}

export function createComplaintId() {
  const number = String(Math.floor(Math.random() * 900000) + 100000);
  return `CIV-${new Date().getFullYear()}-${number}`;
}

export function readLocalComplaints() {
  try {
    return JSON.parse(localStorage.getItem("civora_issues") || "[]");
  } catch {
    return [];
  }
}

export function saveLocalComplaint(complaint) {
  const item = {
    ...complaint,
    complaint_id: complaint.complaint_id || createComplaintId(),
    status: normalizeStatus(complaint.status),
    created_at: complaint.created_at || new Date().toISOString(),
    updated_at: complaint.updated_at || new Date().toISOString(),
  };
  const existing = readLocalComplaints();
  const next = [item, ...existing.filter((entry) => entry.complaint_id !== item.complaint_id)];
  localStorage.setItem("civora_issues", JSON.stringify(next));
  localStorage.setItem("reports", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("civora:complaint", { detail: item }));
  return item;
}

export function formatRelativeTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Just now";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
