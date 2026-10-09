import { notify } from "../../shared/feedback";
import { LoadingState } from "../../shared/Loading";
import "./profile.css";
import { Link } from "react-router-dom";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useId,
  type FormEvent,
} from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { auth, db, callService } from "../../shared/firebase";
import { initialProfileRead, profileReadReducer } from "./profile-state";
import {
  customerSaveResultSchema,
  customerSaveResolutionSchema,
  type CustomerSavePointer,
} from "../../../packages/domain/customer-save";
import {
  readSavePointer,
  reserveSave,
  clearSavePointer,
  type SaveCommand,
} from "./save-recovery";
export function Profile({
  user,
  blocked = false,
  onPendingChange,
}: {
  user: User | null;
  blocked?: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const instanceId = useId();
  const [read, dispatch] = useReducer(profileReadReducer, undefined, () =>
    initialProfileRead(user?.uid),
  );
  const visible =
    read.uid === (user?.uid ?? "") ? read : initialProfileRead(user?.uid);
  const { profile, version, addresses } = visible;
  const currentUid = useRef(user?.uid);
  currentUid.current = user?.uid;
  const setProfile = (value: typeof profile) =>
    dispatch({ type: "edit", uid: user?.uid ?? "", profile: value });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const [resolutionMessage, setResolutionMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const pending = useRef<{ owner: string; command: SaveCommand } | null>(null);
  const durable = useRef<CustomerSavePointer | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryRetry, setRecoveryRetry] = useState(0);
  useEffect(() => {
    pending.current = null;
    durable.current = null;
    writing.current = false;
    setUncertain(false);
    setRecoveryReady(false);
    let live = true;
    if (user)
      void readSavePointer(user.uid)
        .then((pointer) => {
          if (!live || currentUid.current !== user.uid) return;
          durable.current = pointer;
          setUncertain(!!pointer);
          setRecoveryReady(true);
          if (pointer)
            setError(
              "Có lần lưu đang chờ kết quả. Kiểm tra lần lưu trước khi tiếp tục.",
            );
        })
        .catch(() => {
          if (live)
            setError(
              "Chưa kiểm tra được lần lưu trước. Anh/chị thử kiểm tra lại nhé.",
            );
        });
    else setRecoveryReady(true);
    return () => {
      live = false;
      pending.current = null;
      durable.current = null;
    };
  }, [user?.uid, recoveryRetry]);
  useEffect(() => {
    onPendingChange?.(busy || uncertain);
  }, [busy, uncertain, onPendingChange]);
  const epoch = useRef(0),
    writing = useRef(false);
  useEffect(() => {
    epoch.current++;
    dispatch({ type: "reset", uid: user?.uid ?? "" });
    setResolutionMessage("");
    setError("");

    setBusy(false);
    if (!user) return;
    if (!db) {
      dispatch({ type: "profile-error", uid: user.uid });
      dispatch({ type: "addresses-error", uid: user.uid });
      return;
    }
    let active = true;
    let locked = false;
    const uid = user.uid;
    const a = onSnapshot(
      doc(db, "users", uid),
      (s) => {
        if (!active || locked) return;
        const value = s.data();
        if (value?.locked === true) {
          locked = true;
          epoch.current++;
          pending.current = null;
          writing.current = false;
          setUncertain(false);
          dispatch({ type: "locked", uid });
          setError("");

          setBusy(false);
          return;
        }
        dispatch({
          type: "profile",
          uid,
          version: value?.version,
          profile: {
            displayName: value?.displayName ?? user.displayName ?? "",
            businessName: value?.businessName ?? "",
            marketingConsent: value?.marketingConsent === true,
          },
        });
      },
      () => {
        if (active && !locked) dispatch({ type: "profile-error", uid });
      },
    );
    const b = onSnapshot(
      query(
        collection(db, "addresses"),
        where("ownerId", "==", uid),
        limit(20),
      ),
      (s) => {
        if (active && !locked)
          dispatch({
            type: "addresses",
            uid,
            addresses: s.docs.map((d) => ({
              id: d.id,
              recipient: String(d.data().recipient ?? ""),
              address: String(d.data().address ?? ""),
            })),
          });
      },
      () => {
        if (active && !locked) dispatch({ type: "addresses-error", uid });
      },
    );
    return () => {
      active = false;
      epoch.current++;
      a();
      b();
    };
  }, [user?.uid, retry]);
  async function save(
    e?: FormEvent<HTMLFormElement>,
    action?: "saveProfile" | "saveAddress",
  ) {
    e?.preventDefault();
    if (
      !user ||
      auth?.currentUser?.uid !== user.uid ||
      read.locked ||
      writing.current ||
      blocked ||
      read.uid !== user.uid ||
      !read.profileReady ||
      !recoveryReady ||
      ((pending.current?.command.action ?? action) === "saveAddress" &&
        !read.addressesReady)
    )
      return;
    if (durable.current && e) return;
    if (pending.current && (e || pending.current.owner !== user.uid)) return;
    if (!pending.current) {
      if (!e || !action) return;
      const f = new FormData(e.currentTarget);
      pending.current = {
        owner: user.uid,
        command: {
          action,
          operationId: crypto.randomUUID(),
          ...(action === "saveProfile" && version !== undefined
            ? { expectedVersion: version }
            : {}),
          payload:
            action === "saveProfile"
              ? {
                  displayName: String(f.get("displayName") ?? ""),
                  businessName: String(f.get("businessName") ?? ""),
                  marketingConsent: f.get("marketingConsent") === "on",
                }
              : {
                  recipient: String(f.get("recipient") ?? ""),
                  phone: String(f.get("phone") ?? ""),
                  address: String(f.get("address") ?? ""),
                },
        },
      };
    }
    const request = pending.current.command;
    writing.current = true;
    const context = epoch.current,
      owner = user.uid;
    const owns = () =>
      context === epoch.current &&
      currentUid.current === owner &&
      auth?.currentUser?.uid === owner;
    setError("");
    setResolutionMessage("");
    setBusy(true);
    setUncertain(true);
    try {
      if (!durable.current) {
        const reservation = await reserveSave(owner, request);
        if (!owns()) return;
        durable.current = reservation.pointer;
        if (!reservation.reserved) {
          pending.current = null;
          setError(
            "Có lần lưu đang chờ kết quả. Kiểm tra lần lưu trước khi tiếp tục.",
          );
          return;
        }
      }
      const result = customerSaveResultSchema.parse(
        await callService("workspaceCommand", request),
      );
      if (
        (request.action === "saveProfile" && result.id !== owner) ||
        result.version !== (request.expectedVersion ?? 0) + 1
      )
        throw Error("INVALID_SAVE_RESULT");
      if (owns()) {
        await clearSavePointer(owner, durable.current!);
        if (!owns()) return;
        durable.current = null;
        pending.current = null;
        setUncertain(false);
        notify(
          request.action === "saveProfile"
            ? "Đã lưu hồ sơ."
            : "Đã lưu địa chỉ.",
          "success",
        );
      }
    } catch (error) {
      if (owns()) {
        const code = String((error as { code?: unknown })?.code ?? "").replace(
          /^functions\//,
          "",
        );
        if (
          [
            "invalid-argument",
            "permission-denied",
            "unauthenticated",
            "aborted",
            "already-exists",
            "failed-precondition",
          ].includes(code)
        ) {
          pending.current = null;
          setError(
            "Chưa lưu được thông tin. Kiểm tra lần lưu trước khi thử lại.",
          );
        } else if (!durable.current) {
          pending.current = null;
          setUncertain(false);
          setRecoveryReady(false);
          setError("Chưa chuẩn bị được lần lưu. Anh/chị thử kiểm tra lại nhé.");
        } else
          setError(
            "Chưa xác minh được kết quả lưu. Đối chiếu thao tác đang chờ trước khi tiếp tục.",
          );
      }
    } finally {
      if (owns()) {
        writing.current = false;
        setBusy(false);
      }
    }
  }
  async function resolvePrevious() {
    if (pending.current) return save();
    if (
      !user ||
      auth?.currentUser?.uid !== user.uid ||
      !durable.current ||
      writing.current ||
      blocked ||
      visible.locked
    )
      return;
    const pointer = durable.current,
      owner = user.uid,
      context = epoch.current;
    const owns = () =>
      context === epoch.current &&
      currentUid.current === owner &&
      auth?.currentUser?.uid === owner;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      const result = customerSaveResolutionSchema.parse(
        await callService("customerSaveResolve", pointer),
      );
      if (!owns()) return;
      if (
        result.status === "saved" &&
        (result.result.version !== pointer.expectedVersion + 1 ||
          (pointer.action === "saveProfile" && result.result.id !== owner))
      )
        throw Error("INVALID_RECOVERY_RESULT");
      await clearSavePointer(owner, pointer);
      if (!owns()) return;
      durable.current = null;
      setUncertain(false);
      setResolutionMessage(
        result.status === "saved"
          ? "Đã xác minh lần lưu trước thành công. Kiểm tra thông tin đã lưu trước khi cập nhật tiếp."
          : "Lần lưu trước chưa hoàn tất. Anh/chị có thể gửi lại thông tin.",
      );
    } catch {
      if (owns())
        setError(
          "Chưa đối chiếu được kết quả. Giữ nguyên lần lưu đang chờ và thử lại.",
        );
    } finally {
      if (owns()) {
        writing.current = false;
        setBusy(false);
      }
    }
  }
  function readStatus(kind: "profile" | "addresses", overlay: boolean) {
    const message =
      kind === "profile" ? visible.profileError : visible.addressesError;
    const ready =
      kind === "profile" ? visible.profileReady : visible.addressesReady;
    return message ? (
      <div className="profileNotice" role="alert">
        <p>{message}</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => setRetry((n) => n + 1)}
        >
          Thử tải lại
        </button>
      </div>
    ) : !ready ? (
      <LoadingState className="profileHint" overlay={overlay}>
        {kind === "profile" ? "Đang tải hồ sơ…" : "Đang tải địa chỉ…"}
      </LoadingState>
    ) : null;
  }
  return (
    <section
      className="page profilePage"
      aria-labelledby={`${instanceId}-profileTitle`}
    >
      <header className="profileHeader">
        <div>
          <h1 id={`${instanceId}-profileTitle`}>Hồ sơ và địa chỉ</h1>
          <p>Thông tin cá nhân và địa chỉ nhận hàng của bạn.</p>
        </div>
        {user && (
          <Link className="profileOrderLink" to="/account">
            Đơn hàng của tôi <span aria-hidden="true">→</span>
          </Link>
        )}
      </header>
      {!user ? (
        <p className="profileNotice">Đăng nhập để quản lý thông tin của bạn.</p>
      ) : (
        <div className="profileFlow">
          <nav className="profileStepper" aria-label="Các bước quản lý hồ sơ">
            {([1, 2] as const).map((number) => (
              <button
                type="button"
                key={number}
                disabled={busy}
                aria-current={step === number ? "step" : undefined}
                aria-controls={
                  number === 1
                    ? `${instanceId}-profilePersonalPanel`
                    : `${instanceId}-profileAddressPanel`
                }
                onClick={() => setStep(number)}
              >
                <span className="profileStepNumber" aria-hidden="true">
                  {number}
                </span>
                <span>
                  {number === 1 ? "Thông tin cá nhân" : "Địa chỉ nhận hàng"}
                </span>
              </button>
            ))}
          </nav>
          <form
            id={`${instanceId}-profilePersonalPanel`}
            hidden={step !== 1}
            className="form profileCard"
            onSubmit={(e) => void save(e, "saveProfile")}
            aria-labelledby={`${instanceId}-personalTitle`}
          >
            <header className="profileCardHeading">
              <div>
                <h2 id={`${instanceId}-personalTitle`}>Thông tin cá nhân</h2>
                <p>Cập nhật tên và tùy chọn nhận thông tin.</p>
              </div>
            </header>
            {readStatus("profile", step === 1)}
            <fieldset
              disabled={
                busy ||
                blocked ||
                uncertain ||
                !recoveryReady ||
                !visible.profileReady ||
                visible.locked
              }
            >
              <label>
                <span className="formLabelText">
                  Tên hiển thị{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  name="displayName"
                  autoComplete="name"
                  value={profile.displayName}
                  onChange={(e) =>
                    setProfile({ ...profile, displayName: e.target.value })
                  }
                  required
                  maxLength={120}
                />
              </label>
              <label>
                Tên hộ kinh doanh
                <input
                  name="businessName"
                  autoComplete="organization"
                  maxLength={160}
                  value={profile.businessName}
                  onChange={(e) =>
                    setProfile({ ...profile, businessName: e.target.value })
                  }
                />
              </label>
              <label className="profileConsent">
                <input
                  type="checkbox"
                  name="marketingConsent"
                  checked={profile.marketingConsent}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      marketingConsent: e.target.checked,
                    })
                  }
                />
                <span>Nhận thông tin ưu đãi từ SatsunicGo</span>
              </label>
              <div className="profileFormFooter">
                <button className="primary" disabled={busy}>
                  Lưu hồ sơ
                </button>
              </div>
            </fieldset>
          </form>
          <div
            id={`${instanceId}-profileAddressPanel`}
            hidden={step !== 2}
            className="profileAddressColumn"
          >
            {!visible.profileReady && readStatus("profile", step === 2)}
            <section
              className="profileCard"
              aria-labelledby={`${instanceId}-addressesTitle`}
            >
              <header className="profileCardHeading">
                <div>
                  <h2 id={`${instanceId}-addressesTitle`}>Địa chỉ đã lưu</h2>
                  <p>Thông tin người nhận cho đơn hàng của bạn.</p>
                </div>
              </header>
              {visible.locked ? (
                <p className="profileHint">
                  Địa chỉ không khả dụng khi tài khoản bị khóa.
                </p>
              ) : (
                readStatus("addresses", step === 2)
              )}
              {!visible.locked &&
                visible.addressesReady &&
                !visible.profileReady && (
                  <p className="profileHint">
                    {visible.profileError
                      ? "Địa chỉ sẽ hiển thị khi tải lại hồ sơ thành công."
                      : "Đang xác minh hồ sơ để hiển thị địa chỉ…"}
                  </p>
                )}
              {visible.profileReady &&
                visible.addressesReady &&
                !visible.locked &&
                (addresses.length ? (
                  <div className="profileAddressList">
                    {addresses.map((a) => (
                      <article className="profileAddress" key={a.id}>
                        <strong>{a.recipient}</strong>
                        <p>{a.address}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="profileEmpty">
                    Chưa có địa chỉ đã lưu. Thêm địa chỉ nhận hàng bên dưới.
                  </p>
                ))}
            </section>
            <form
              key={`${user.uid}:${visible.locked}`}
              className="form profileCard"
              onSubmit={(e) => void save(e, "saveAddress")}
              aria-labelledby={`${instanceId}-newAddressTitle`}
            >
              <header className="profileCardHeading">
                <div>
                  <h2 id={`${instanceId}-newAddressTitle`}>
                    Thêm địa chỉ nhận hàng
                  </h2>
                </div>
              </header>
              <fieldset
                disabled={
                  busy ||
                  blocked ||
                  uncertain ||
                  !recoveryReady ||
                  !visible.profileReady ||
                  !visible.addressesReady ||
                  visible.locked
                }
              >
                <div className="profileFieldsRow">
                  <label>
                    <span className="formLabelText">
                      Người nhận{" "}
                      <span className="requiredMark" aria-hidden="true">
                        *
                      </span>
                    </span>
                    <input
                      name="recipient"
                      autoComplete="shipping name"
                      minLength={2}
                      maxLength={120}
                      required
                    />
                  </label>
                  <label>
                    <span className="formLabelText">
                      Số điện thoại{" "}
                      <span className="requiredMark" aria-hidden="true">
                        *
                      </span>
                    </span>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="shipping tel"
                      minLength={8}
                      maxLength={20}
                      required
                    />
                  </label>
                </div>
                <label>
                  <span className="formLabelText">
                    Địa chỉ{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <textarea
                    name="address"
                    autoComplete="shipping street-address"
                    minLength={10}
                    maxLength={500}
                    required
                    rows={3}
                  />
                </label>
                <div className="profileFormFooter">
                  <button className="primary" disabled={busy}>
                    Lưu địa chỉ
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
      {user && visible.uid === read.uid && (
        <div className="profileSaveStatus" aria-live="polite">
          {busy && (
            <LoadingState overlay={false}>Đang lưu thông tin…</LoadingState>
          )}
          {resolutionMessage && (
            <p role="status" className="profileHint">
              {resolutionMessage}
            </p>
          )}
          {error && (
            <p role="alert" className="profileNotice">
              {error}
            </p>
          )}
        </div>
      )}
      {user && uncertain && !visible.locked && (
        <button
          type="button"
          disabled={busy || blocked || !recoveryReady}
          onClick={() => void resolvePrevious()}
        >
          Đối chiếu thao tác đang chờ
        </button>
      )}
      {user && !recoveryReady && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setRecoveryRetry((value) => value + 1)}
        >
          Thử kiểm tra lại
        </button>
      )}
      <footer className="profilePrivacy">
        <span>Dữ liệu cá nhân</span>
        <Link to="/support?topic=data-export">Yêu cầu xuất dữ liệu</Link>
        <Link to="/support?topic=data-deletion">Yêu cầu xóa dữ liệu</Link>
      </footer>
    </section>
  );
}
