import { crc16 } from "../../packages/domain/payment-qr";
export function fixtureQR(
  amount = 650,
  accountNumber = "00000000",
  description = "SG 100001",
) {
  const f = (id: string, v: string) =>
    id + String(v.length).padStart(2, "0") + v;
  const bank = f("00", "970000") + f("01", accountNumber),
    merchant = f("00", "A000000727") + f("01", bank) + f("02", "QRIBFTTA");
  const raw =
    f("00", "01") +
    f("01", "12") +
    f("38", merchant) +
    f("53", "704") +
    f("54", String(amount)) +
    f("58", "VN") +
    f("62", f("08", description)) +
    "6304";
  return raw + crc16(raw);
}
