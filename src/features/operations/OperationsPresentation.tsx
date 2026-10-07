import type { ReactNode } from "react";
import { CrmIcon } from "../crm/CrmPresentation";

export function OperationsEmpty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="operationsEmpty" role="status">
      <span className="operationsEmptyIcon">
        <CrmIcon name="box" />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
