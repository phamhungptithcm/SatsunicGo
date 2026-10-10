import type { User } from "firebase/auth";
import { useEffect, useId, useRef, useState } from "react";
import {
  notificationState,
  type NotificationTopic,
} from "../../../packages/domain/notification-preferences";
import { callService } from "../../shared/firebase";
import {
  useNotificationPreferences,
  type NotificationPreferencesController,
} from "./use-notification-preferences";
import "./subscription-preferences.css";
const labels: Record<NotificationTopic, string> = {
  orderEmail: "Cập nhật đơn hàng qua email",
  promotionsEmail: "Ưu đãi qua email",
  orderSms: "Cập nhật đơn hàng qua SMS",
};
export function NotificationSaveStatus({
  controller: c,
}: {
  controller: NotificationPreferencesController;
}) {
  return (
    <div className="subscriptionStatus" aria-live="polite">
      {c.error && <p role="alert">{c.error}</p>}
      {c.message && <p role="status">{c.message}</p>}
      {c.error && !c.busy && (
        <button
          type="button"
          onClick={() => void (c.uncertain ? c.save() : c.load())}
        >
          {c.uncertain ? "Kiểm tra lần gửi" : "Thử tải lại"}
        </button>
      )}
    </div>
  );
}
export function CheckoutNotificationChoices({
  controller: c,
}: {
  controller: NotificationPreferencesController;
}) {
  const id = useId(),
    emailCheckbox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (emailCheckbox.current)
      emailCheckbox.current.indeterminate =
        c.selected.orderEmail !== c.selected.promotionsEmail;
  }, [c.selected.orderEmail, c.selected.promotionsEmail, c.view]);
  return (
    <div className="subscriptionChoices purchaseWide">
      {!c.view ? (
        <>
          <span className="subscriptionMuted">
            {c.busy
              ? "Đang tải tùy chọn nhận tin…"
              : "Tùy chọn nhận tin chưa tải được."}
          </span>
          <NotificationSaveStatus controller={c} />
        </>
      ) : (
        <>
          <label>
            <input
              ref={emailCheckbox}
              type="checkbox"
              checked={c.selected.orderEmail && c.selected.promotionsEmail}
              disabled={c.busy || c.uncertain}
              onChange={(e) =>
                c.setSelected({
                  ...c.selected,
                  orderEmail: e.target.checked,
                  promotionsEmail: e.target.checked,
                })
              }
            />
            <span>Nhận cập nhật đơn hàng và ưu đãi qua email</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={c.selected.orderSms}
              disabled={c.busy || c.uncertain}
              onChange={(e) =>
                c.setSelected({ ...c.selected, orderSms: e.target.checked })
              }
            />
            <span>Nhận cập nhật đơn hàng qua SMS</span>
          </label>
          {c.selected.orderSms && (
            <label className="subscriptionPhone" htmlFor={id}>
              <span>Số di động nhận thông báo</span>
              <input
                id={id}
                type="tel"
                autoComplete="tel"
                value={c.phone}
                maxLength={20}
                disabled={c.busy || c.uncertain}
                onChange={(e) => c.setPhone(e.target.value)}
                placeholder="Số di động của bạn"
              />
              {!c.view.availability.sms && (
                <small>SMS chưa sẵn sàng. Bạn vẫn có thể lưu lựa chọn.</small>
              )}
            </label>
          )}
        </>
      )}
    </div>
  );
}
export function NotificationPreferences({
  user,
  blocked = false,
  onPendingChange,
}: {
  user: User;
  blocked?: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const c = useNotificationPreferences(user, "profile"),
    id = useId();
  useEffect(() => {
    onPendingChange?.(c.busy || c.uncertain);
    return () => onPendingChange?.(false);
  }, [c.busy, c.uncertain, onPendingChange]);
  return (
    <section className="profileCard subscriptionPanel" aria-labelledby={id}>
      <header className="profileCardHeading">
        <div>
          <h2 id={id}>Thông báo</h2>
          <p>Chọn cách nhận tin từ SatsunicGo.</p>
        </div>
      </header>
      {!c.view ? (
        <p className="subscriptionMuted">
          {c.busy ? "Đang tải tùy chọn…" : "Chưa tải được tùy chọn."}
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void c.save();
          }}
        >
          <fieldset disabled={blocked || c.busy || c.uncertain}>
            {(["orderEmail", "promotionsEmail", "orderSms"] as const).map(
              (topic) => {
                const channel = topic === "orderSms" ? "sms" : "email",
                  available = c.view!.availability[channel];
                const state = notificationState(c.view!.topics[topic]);
                return (
                  <div className="subscriptionRow" key={topic}>
                    <div>
                      <label htmlFor={`${id}-${topic}`}>{labels[topic]}</label>
                      <small>
                        {!available
                          ? "Chưa sẵn sàng"
                          : state === "active"
                            ? "Đang nhận"
                            : state === "pending"
                              ? "Chờ xác nhận"
                              : "Đã tắt"}
                      </small>
                    </div>
                    <input
                      id={`${id}-${topic}`}
                      type="checkbox"
                      role="switch"
                      checked={c.selected[topic]}
                      onChange={(e) =>
                        c.setSelected({
                          ...c.selected,
                          [topic]: e.target.checked,
                        })
                      }
                    />
                  </div>
                );
              },
            )}
            <label className="subscriptionPhone">
              <span>Số di động nhận SMS</span>
              <input
                type="tel"
                autoComplete="tel"
                value={c.phone}
                maxLength={20}
                onChange={(e) => c.setPhone(e.target.value)}
              />
            </label>
            <div className="profileFormFooter">
              <button className="primary" disabled={!c.dirty}>
                Lưu tùy chọn
              </button>
            </div>
            {(["email", "sms"] as const).map(
              (channel) =>
                c.view!.availability[channel] &&
                Object.entries(c.view!.topics).some(
                  ([key, t]) =>
                    (key === "orderSms" ? "sms" : "email") === channel &&
                    notificationState(t) === "pending",
                ) && (
                  <button
                    type="button"
                    key={channel}
                    disabled={c.dirty}
                    onClick={() => void c.resend(channel)}
                  >
                    Gửi lại xác nhận {channel === "sms" ? "SMS" : "email"}
                  </button>
                ),
            )}
          </fieldset>
        </form>
      )}
      <NotificationSaveStatus controller={c} />
    </section>
  );
}
export function NotificationLinkAction() {
  const [link] = useState(() => {
    if (typeof window === "undefined") return null;
    const match = /^#notification-(confirm|unsubscribe)=([a-f0-9]{64})$/.exec(
      window.location.hash,
    );
    return match
      ? { action: match[1] as "confirm" | "unsubscribe", token: match[2] }
      : null;
  });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (link)
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
  }, [link]);
  if (!link) return null;
  async function submit() {
    if (busy || !link) return;
    setBusy(true);
    try {
      await callService("notificationPreferences", link);
      setMessage(
        link.action === "confirm"
          ? "Đã xác nhận đăng ký nhận tin."
          : "Đã tắt loại tin trong liên kết này.",
      );
    } catch {
      setMessage(
        "Liên kết chưa xử lý được hoặc đã hết hạn. Thử lại hoặc quản lý trong Thông báo.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="profileCard subscriptionPanel">
      <h2>
        {link.action === "confirm"
          ? "Xác nhận đăng ký nhận tin"
          : "Tắt nhận tin"}
      </h2>
      <button type="button" disabled={busy} onClick={() => void submit()}>
        {busy
          ? "Đang xử lý…"
          : link.action === "confirm"
            ? "Xác nhận đăng ký"
            : "Tắt nhận tin"}
      </button>
      <p role="status">{message}</p>
    </section>
  );
}
