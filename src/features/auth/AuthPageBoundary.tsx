import { Fragment, useState, type ReactNode } from "react";

/** Keep guest work on first login; discard private UI on logout/account switch. */
export function AuthPageBoundary({ uid, children }: {
  uid: string | null;
  children: ReactNode;
}) {
  const [scope, setScope] = useState({ uid, generation: 0 });
  if (scope.uid !== uid) {
    setScope({ uid, generation: scope.generation + (scope.uid === null ? 0 : 1) });
  }
  return <Fragment key={scope.generation}>{children}</Fragment>;
}
