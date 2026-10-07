import { LoadingState } from "../../shared/Loading";
import {
  createContext,
  useContext,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type ButtonHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

export const CrmHeaderTarget = createContext<HTMLElement | null>(null);

export type CrmIconName =
  | "refresh"
  | "check"
  | "document"
  | "box"
  | "clock"
  | "message"
  | "warning"
  | "search"
  | "person"
  | "arrow";

const paths: Record<CrmIconName, ReactNode> = {
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M5 8a7 7 0 0 1 12-3l3 3M4 16l3 3a7 7 0 0 0 12-3" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  document: (
    <>
      <path d="M14 3H5v18h14V8l-5-5ZM14 3v5h5M8 12h8M8 16h6" />
    </>
  ),
  box: <path d="m3 7 9-4 9 4v10l-9 4-9-4ZM3 7l9 4 9-4M12 11v10" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  message: (
    <path d="M21 11a8 8 0 0 1-8 8H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4ZM7 8h10M7 12h6" />
  ),
  warning: (
    <>
      <path d="m12 3 10 18H2L12 3ZM12 9v4" />
      <circle cx="12" cy="17" r=".5" />
    </>
  ),
  search: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m15 15 6 6" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
};

/** Decorative symbols: the accompanying text supplies the accessible meaning. */
export function CrmIcon({ name }: { name: CrmIconName }) {
  return (
    <svg
      className="crmIcon"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function CrmHeading({
  title,
  description,
  actions,
  reload,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  reload?: ReactNode;
}) {
  const target = useContext(CrmHeaderTarget);
  if (target) {
    const refresh = isValidElement(reload)
      ? cloneElement(
          reload as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>,
          {
            className: "crmHeaderRefresh",
            "aria-label": `Tải lại ${title.toLocaleLowerCase("vi-VN")}`,
            title: "Tải lại",
            children: <CrmIcon name="refresh" />,
          },
        )
      : reload;
    return (
      <>
        {createPortal(
          <div className="crmHeaderTitle">
            <h1>{title}</h1>
            {refresh}
          </div>,
          target,
        )}
        {actions && <div className="crmActions crmPageActions">{actions}</div>}
      </>
    );
  }
  return (
    <div className="pageHeading crmHeading">
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {(reload || actions) && (
        <div className="crmActions">
          {reload}
          {actions}
        </div>
      )}
    </div>
  );
}

export function CrmState({
  kind,
  title,
  children,
  action,
}: {
  kind: "loading" | "empty" | "error";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  if (kind === "loading")
    return (
      <LoadingState className="crmLoading" variant="overlay">
        <strong>{title}</strong>
        {children}
        {action}
      </LoadingState>
    );
  return (
    <div
      className={`crmState crmState--${kind}`}
      role={kind === "error" ? "alert" : undefined}
    >
      <span className="crmStateIcon">
        <CrmIcon name={kind === "error" ? "warning" : "check"} />
      </span>
      <div className="crmStateContent">
        <strong>{title}</strong>
        {children && <div className="crmStateDescription">{children}</div>}
      </div>
      {action && <div className="crmActions">{action}</div>}
    </div>
  );
}

/** Full identifiers remain available; this component never fabricates a short code. */
export function CrmReference({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="crmReference">
      <span>{label}</span>
      <code>{value}</code>
    </span>
  );
}
