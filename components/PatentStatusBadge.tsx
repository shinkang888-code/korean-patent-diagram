const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  등록: { label: "등록", cls: "badge-green" },
  R: { label: "등록", cls: "badge-green" },
  공개: { label: "공개", cls: "badge-blue" },
  A: { label: "공개", cls: "badge-blue" },
  거절: { label: "거절", cls: "badge-red" },
  J: { label: "거절", cls: "badge-red" },
  소멸: { label: "소멸", cls: "badge-gray" },
  취하: { label: "취하", cls: "badge-gray" },
};

export default function PatentStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const mapped = STATUS_MAP[status] ?? { label: status, cls: "badge-gray" };
  return <span className={mapped.cls}>{mapped.label}</span>;
}
