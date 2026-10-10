import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { auth, callService } from "../../shared/firebase";
import {
  notificationPhoneSchema,
  notificationRequestSchema,
  type NotificationChannel,
  type NotificationPreferencesView,
  type NotificationRequest,
  type NotificationSelections,
} from "../../../packages/domain/notification-preferences";
import {
  notificationViewSchema,
  selectedNotifications,
} from "./subscription-state";
type Mutation = Extract<NotificationRequest, { action: "save" | "resend" }>;
const blank: NotificationSelections = {
  orderEmail: false,
  promotionsEmail: false,
  orderSms: false,
};
export function useNotificationPreferences(
  user: User | null,
  source: "checkout" | "profile",
) {
  const owner = user?.uid ?? "";
  const current = useRef(owner);
  current.current = owner;
  const epoch = useRef(0),
    flight = useRef(false),
    pending = useRef<Mutation | null>(null);
  const [state, setState] = useState<{
    owner: string;
    view: NotificationPreferencesView | null;
    selected: NotificationSelections;
    phone: string;
    error: string;
    busy: boolean;
    message: string;
    uncertain: boolean;
  }>({
    owner,
    view: null,
    selected: blank,
    phone: "",
    error: "",
    busy: false,
    message: "",
    uncertain: false,
  });
  const visible =
    state.owner === owner
      ? state
      : {
          owner,
          view: null,
          selected: blank,
          phone: "",
          error: "",
          busy: false,
          message: "",
          uncertain: false,
        };
  const load = useCallback(async () => {
    if (!owner || flight.current || pending.current) return;
    const context = ++epoch.current;
    setState((s) => ({ ...s, owner, view: null, error: "", busy: true }));
    try {
      const view = notificationViewSchema.parse(
        await callService("notificationPreferences", { action: "read" }),
      );
      if (context === epoch.current && current.current === owner)
        setState({
          owner,
          view,
          selected: selectedNotifications(view),
          phone: view.phone,
          error: "",
          busy: false,
          message: "",
          uncertain: false,
        });
    } catch {
      if (context === epoch.current && current.current === owner)
        setState((s) => ({
          ...s,
          owner,
          busy: false,
          error: "Chưa tải được tùy chọn thông báo. Thử tải lại.",
        }));
    }
  }, [owner]);
  useEffect(() => {
    flight.current = false;
    pending.current = null;
    setState({
      owner,
      view: null,
      selected: blank,
      phone: "",
      error: "",
      busy: false,
      message: "",
      uncertain: false,
    });
    void load();
    return () => {
      epoch.current++;
    };
  }, [owner, load]);
  const dirty =
    !!visible.view &&
    (visible.phone !== visible.view.phone ||
      Object.keys(blank).some(
        (k) =>
          visible.selected[k as keyof typeof blank] !==
          visible.view!.topics[k as keyof typeof blank].requested,
      ));
  async function mutate(channel?: NotificationChannel) {
    if (
      !owner ||
      auth?.currentUser?.uid !== owner ||
      !visible.view ||
      flight.current
    )
      return;
    const context = epoch.current;
    if (!pending.current) {
      if (!channel && !dirty) return;
      const phone = notificationPhoneSchema.safeParse(visible.phone);
      if (
        !channel &&
        (!phone.success || (visible.selected.orderSms && !phone.data))
      ) {
        setState((s) => ({
          ...s,
          error: "Nhập số di động của bạn để nhận SMS.",
        }));
        return;
      }
      pending.current = notificationRequestSchema.parse(
        channel
          ? {
              action: "resend",
              channel,
              operationId: crypto.randomUUID(),
              expectedVersion: visible.view.version,
            }
          : {
              action: "save",
              operationId: crypto.randomUUID(),
              expectedVersion: visible.view.version,
              selected: visible.selected,
              phone: phone.success ? phone.data : "",
              source,
            },
      ) as Mutation;
    }
    const command = pending.current;
    flight.current = true;
    setState((s) => ({
      ...s,
      busy: true,
      error: "",
      message: "",
      uncertain: true,
    }));
    const owns = () =>
      current.current === owner &&
      epoch.current === context &&
      auth?.currentUser?.uid === owner;
    try {
      const view = notificationViewSchema.parse(
        await callService("notificationPreferences", command),
      );
      if (!owns()) return;
      pending.current = null;
      setState({
        owner,
        view,
        selected: selectedNotifications(view),
        phone: view.phone,
        error: "",
        busy: false,
        uncertain: false,
        message:
          command.action === "resend"
            ? "Đã lưu yêu cầu gửi lại xác nhận."
            : "Đã lưu tùy chọn thông báo.",
      });
    } catch (error) {
      if (!owns()) return;
      const code = String((error as { code?: unknown }).code ?? "").replace(
        /^functions\//,
        "",
      );
      const definitive = [
        "invalid-argument",
        "permission-denied",
        "unauthenticated",
        "aborted",
        "already-exists",
        "failed-precondition",
        "resource-exhausted",
      ].includes(code);
      if (definitive) pending.current = null;
      setState((s) => ({
        ...s,
        busy: false,
        uncertain: !definitive,
        error:
          code === "aborted"
            ? "Tùy chọn đã thay đổi. Tải lại trước khi lưu."
            : code === "resource-exhausted"
              ? "Chờ một lúc rồi yêu cầu xác nhận lại."
              : definitive
                ? "Chưa lưu được tùy chọn thông báo. Tải lại rồi thử lại."
                : "Chưa rõ kết quả lưu. Kiểm tra lại lần gửi này.",
      }));
    } finally {
      if (owns()) flight.current = false;
    }
  }
  return {
    ...visible,
    dirty,
    load,
    save: () => mutate(),
    resend: (channel: NotificationChannel) => mutate(channel),
    setSelected: (selected: NotificationSelections) => {
      if (!visible.busy && !visible.uncertain)
        setState((s) => ({ ...s, selected, error: "", message: "" }));
    },
    setPhone: (phone: string) => {
      if (!visible.busy && !visible.uncertain)
        setState((s) => ({ ...s, phone, error: "", message: "" }));
    },
  };
}
export type NotificationPreferencesController = ReturnType<
  typeof useNotificationPreferences
>;
