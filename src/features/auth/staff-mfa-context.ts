import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export type StaffMfaState = {
  user: User | null;
  status: "checking" | "customer" | "setup" | "ready" | "error" | "unavailable";
  retry: () => void;
};
export const StaffMfaContext = createContext<StaffMfaState | null>(null);
export function useStaffMfaReady(user: User | null) {
  const state = useContext(StaffMfaContext);
  return Boolean(user && state?.user === user && state.status === "ready");
}
export function useStaffMfaRecovery(user: User | null) {
  const state = useContext(StaffMfaContext);
  return {
    unavailable: state?.user === user && state.status === "unavailable",
    retry: state?.retry,
  };
}
export function useOptionalMfaAccess(user: User | null) {
  const state = useContext(StaffMfaContext);
  return {
    blocked: Boolean(
      user &&
      state &&
      (state.user !== user || !["customer", "ready"].includes(state.status)),
    ),
    status: state?.status,
    retry: state?.retry,
  };
}
