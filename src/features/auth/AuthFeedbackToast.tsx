import { useEffect, useRef } from "react";
import { notify } from "../../shared/feedback";

/** Public login feedback; CRM keeps its contextual recovery controls. */
export function AuthFeedbackToast({
  message,
  staff,
}: {
  message: string;
  staff: boolean;
}) {
  const shown = useRef("");
  useEffect(() => {
    if (shown.current === message) return;
    shown.current = message;
    if (message && !staff) notify(message, "error");
  }, [message, staff]);
  return null;
}
