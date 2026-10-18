import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { Link, useSearchParams } from "react-router-dom";
import { callService } from "../../shared/firebase";
import { invitationId } from "../../../packages/domain/staff-invitation";
import "./staff-invitations.css";
export function StaffInvitationAccept({
  user,
  signIn,
  signOut,
  busy: authBusy,
}: {
  user: User | null;
  signIn: () => void;
  signOut: () => void;
  busy: boolean;
}) {
  const [params] = useSearchParams(),
    id = params.get("id") ?? "";
  const [state, setState] = useState("loading"),
    [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const generation = useRef(0),
    flight = useRef(false);
  useEffect(() => {
    const token = ++generation.current;
    setMessage("");
    setBusy(false);
    flight.current = false;
    if (!invitationId.safeParse(id).success) {
      setState("invalid");
      return;
    }
    if (!user) {
      setState("anonymous");
      return;
    }
    setState("loading");
    void callService<{ state: string }>("readStaffInvitation", { id })
      .then((result) => {
        if (token === generation.current) setState(result.state);
      })
      .catch((cause) => {
        if (token !== generation.current) return;
        const code = String((cause as { code?: string }).code ?? "");
        setState(code.endsWith("permission-denied") ? "denied" : "error");
      });
    return () => {
      generation.current++;
    };
  }, [id, user, revision]);
  async function accept() {
    if (flight.current || state !== "pending") return;
    flight.current = true;
    setBusy(true);
    setMessage("");
    const token = generation.current;
    try {
      const result = await callService<{ state: string }>(
        "acceptStaffInvitation",
        { id },
      );
      if (token === generation.current) setState(result.state);
    } catch {
      if (token === generation.current) {
        setState("error");
        setMessage(
          "Chưa xác nhận được kết quả chấp nhận. Kiểm tra lại lời mời để tiếp tục.",
        );
      }
    } finally {
      if (token === generation.current) {
        setBusy(false);
        flight.current = false;
      }
    }
  }
  return (
    <section
      className="panel staffInviteAccept"
      aria-labelledby="staff-join-title"
    >
      <h1 id="staff-join-title">Lời mời tham gia SatsunicGo</h1>
      {user && (
        <p className="staffInviteIdentity">
          Tài khoản đang dùng: <strong>{user.email}</strong>
        </p>
      )}
      {state === "loading" && <p role="status">Đang kiểm tra lời mời…</p>}
      {state === "anonymous" && (
        <>
          <p>Đăng nhập bằng tài khoản Google nhận email này để xem lời mời.</p>
          <button className="primary" disabled={authBusy} onClick={signIn}>
            Đăng nhập với Google
          </button>
        </>
      )}
      {state === "pending" && (
        <>
          <p>
            Bạn được mời tham gia đội ngũ SatsunicGo. Sau khi bạn chấp nhận, chủ
            doanh nghiệp sẽ phân quyền làm việc.
          </p>
          <button
            className="primary"
            disabled={busy || authBusy}
            onClick={() => void accept()}
          >
            {busy ? "Đang chấp nhận…" : "Chấp nhận tham gia"}
          </button>
        </>
      )}
      {state === "accepted" && (
        <>
          <p role="status">
            Bạn đã chấp nhận lời mời. Chủ doanh nghiệp sẽ cấp quyền làm việc cho
            bạn.
          </p>
          <Link to="/crm">Kiểm tra quyền vào CRM</Link>
        </>
      )}
      {state === "denied" && (
        <p role="alert">
          Lời mời không dành cho tài khoản này hoặc không còn khả dụng. Thử tài
          khoản Google nhận email lời mời.
        </p>
      )}
      {state === "invalid" && (
        <p role="alert">
          Link lời mời chưa hợp lệ. Mở lại link trong email hoặc liên hệ người
          mời.
        </p>
      )}
      {state === "expired" && (
        <p role="status">
          Lời mời đã hết hạn. Liên hệ người mời để nhận lời mời mới.
        </p>
      )}
      {state === "revoked" && (
        <p role="status">
          Lời mời đã được thu hồi. Liên hệ người mời nếu bạn vẫn cần tham gia.
        </p>
      )}
      {state === "error" && (
        <>
          <p role="alert">
            {message ||
              "Chưa kiểm tra được lời mời. Kiểm tra kết nối rồi thử lại."}
          </p>
          <button onClick={() => setRevision((v) => v + 1)}>
            Kiểm tra lại lời mời
          </button>
        </>
      )}
      {user && (
        <button disabled={busy || authBusy} onClick={signOut}>
          Đăng xuất để đổi tài khoản
        </button>
      )}
    </section>
  );
}
