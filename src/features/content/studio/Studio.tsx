import { auth, logout } from "../../../shared/firebase";
import { SourceStudio } from "./SourceStudio";
/** Go route entry; editorial capabilities are checked by the source-view service adapter. */
export function Studio({
  uid,
  name,
  avatar,
  signOut,
}: {
  uid?: string;
  roles?: string[];
  name?: string;
  avatar?: string;
  signOut?: () => Promise<void>;
}) {
  const identity = uid ?? auth?.currentUser?.uid;
  if (!identity || auth?.currentUser?.uid !== identity)
    return <p role="alert">Đăng nhập tài khoản biên tập để mở Studio.</p>;
  return (
    <SourceStudio
      key={identity}
      uid={identity}
      name={name ?? auth?.currentUser?.displayName ?? "Tài khoản"}
      avatar={avatar ?? auth?.currentUser?.photoURL ?? undefined}
      signOut={signOut ?? logout}
    />
  );
}
