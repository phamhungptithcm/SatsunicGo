import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CrmAccessScreen } from "../../src/features/auth/CrmAccessScreen";
import {
  loginFeedback,
  publishAuthFailure,
  authFeedbackSnapshot,
  subscribeAuthFeedback,
  clearAuthFeedback,
} from "../../src/features/auth/auth-feedback";
function render(props: Parameters<typeof CrmAccessScreen>[0]) {
  return renderToStaticMarkup(
    createElement(MemoryRouter, {}, createElement(CrmAccessScreen, props)),
  );
}
describe("CRM097 login and safe access states", () => {
  it("never leaks raw provider data into login feedback", () => {
    expect(
      loginFeedback({
        code: "auth/network-request-failed",
        message: "secret@example.test",
      }),
    ).toContain("Kiểm tra mạng");
    expect(
      loginFeedback({ message: "private provider payload" }),
    ).not.toContain("private");
    expect(loginFeedback({ code: "auth/popup-closed-by-user" })).toContain(
      "Đã đóng",
    );
    expect(loginFeedback({ code: "auth/unauthorized-domain" })).toContain(
      "quản trị viên",
    );
  });
  it("retains redirect errors until UI subscribes, supports recovery and unsubscribe", () => {
    clearAuthFeedback();
    publishAuthFailure({ code: "auth/network-request-failed" });
    expect(authFeedbackSnapshot()).toContain("Kiểm tra mạng");
    const listener = vi.fn();
    const stop = subscribeAuthFeedback(listener);
    clearAuthFeedback();
    expect(listener).toHaveBeenCalledOnce();
    expect(authFeedbackSnapshot()).toBe("");
    stop();
    publishAuthFailure({});
    expect(listener).toHaveBeenCalledOnce();
    clearAuthFeedback();
  });
  it("blocks a new popup while an MFA challenge is pending without granting access", () => {
    const html = render({ state: "anonymous", mfa: true, signIn: () => {} });
    expect(html).toContain('disabled=""');
    expect(html).toContain("Nhập mã xác thực");
    expect(html).not.toContain("Đã đăng nhập");
  });
  it("separates checking, read error and denied states", () => {
    expect(render({ state: "checking" })).toContain("Đang kiểm tra quyền CRM");
    expect(render({ state: "checking" })).not.toContain("Chưa có quyền");
    expect(render({ state: "error", retry: () => {} })).toContain(
      "Kiểm tra lại quyền",
    );
    expect(render({ state: "denied", signOut: () => {} })).toContain(
      "Dùng tài khoản khác",
    );
    expect(render({ state: "denied" })).not.toContain("Tiếp tục với Google");
  });
});
