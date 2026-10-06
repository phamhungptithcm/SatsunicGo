export function crc16(value: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let n = 0; n < 8; n++)
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function fields(value: string) {
  const result = new Map<string, string>();
  let pos = 0;
  while (pos < value.length) {
    const tag = value.slice(pos, pos + 2),
      length = value.slice(pos + 2, pos + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(length))
      throw Error("INVALID_QR");
    const size = Number(length);
    if (!size || pos + 4 + size > value.length || result.has(tag))
      throw Error("INVALID_QR");
    result.set(tag, value.slice(pos + 4, pos + 4 + size));
    pos += 4 + size;
  }
  return result;
}
/** Validate provider VietQR against the same merchant, amount and order reference. */
export function validatePaymentQr(
  qr: string,
  expected: {
    accountNumber: string;
    amount: number;
    description: string;
    bin?: string;
  },
) {
  if (
    qr.length > 2000 ||
    !/^[\x20-\x7E]+$/.test(qr) ||
    !qr.endsWith(crc16(qr.slice(0, -4)))
  )
    throw Error("INVALID_QR");
  const root = fields(qr),
    merchant = fields(root.get("38") ?? ""),
    account = fields(merchant.get("01") ?? ""),
    reference = fields(root.get("62") ?? "");
  if (
    root.get("00") !== "01" ||
    root.get("53") !== "704" ||
    root.get("58") !== "VN" ||
    root.get("63") !== qr.slice(-4) ||
    !qr.slice(-8).startsWith("6304") ||
    merchant.get("00") !== "A000000727" ||
    account.get("01") !== expected.accountNumber ||
    (expected.bin && account.get("00") !== expected.bin) ||
    root.get("54") !== String(expected.amount) ||
    reference.get("08") !== expected.description
  )
    throw Error("QR_INTENT_MISMATCH");
  return qr;
}
export type ChatPayment = {
  checkoutUrl: string;
  qrCode?: string;
  amount?: number;
  accountNumber?: string;
  description?: string;
  bin?: string;
  expiresAt?: number;
};
