import QRCode from "qrcode";
import { state } from "./mock";
export default {
  toDataURL: (...args: Parameters<typeof QRCode.toDataURL>) => {
    if (state.qrFail) return Promise.reject(Error("synthetic QR failure"));
    return QRCode.toDataURL(...args);
  },
};
