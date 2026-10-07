export function policyVersionLabel(value: unknown): string {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? `Phiên bản ${value}`
    : "Chưa có phiên bản";
}

export function policyDateLabel(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return "Chưa có thời gian";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("vi-VN")
    : "Chưa có thời gian";
}
