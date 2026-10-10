import type { EmailContent } from "./resend";

export const selfTestTemplateVersion = "self-test-v1";
export const selfTestContent: EmailContent = Object.freeze({
  subject: "Email thử từ SatsunicGo",
  text: "Đây là email thử từ SatsunicGo.\n\nCảm ơn bạn đã giúp kiểm tra.",
  html: '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email thử từ SatsunicGo</title></head><body style="margin:0;background:#ffffff;color:#111c35;font-family:Arial,sans-serif;line-height:1.6"><main style="max-width:520px;margin:0 auto;padding:32px 20px"><p>Đây là email thử từ SatsunicGo.</p><p>Cảm ơn bạn đã giúp kiểm tra.</p></main></body></html>',
});
