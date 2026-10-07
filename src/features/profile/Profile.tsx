import { LoadingState } from "../../shared/Loading";
import "./profile.css";
import { Link } from "react-router-dom";
import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
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
export function Profile({ user }: { user: User | null }) {
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
    [saved, setSaved] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const epoch = useRef(0),
    writing = useRef(false);
  useEffect(() => {
    epoch.current++;
    dispatch({ type: "reset", uid: user?.uid ?? "" });
    setError("");
    setSaved("");
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
          dispatch({ type: "locked", uid });
          setError("");
          setSaved("");
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
  async function save(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    if (
      !user ||
      auth?.currentUser?.uid !== user.uid ||
      read.locked ||
      writing.current ||
      read.uid !== user.uid ||
      !read.profileReady ||
      (action === "saveAddress" && !read.addressesReady)
    )
      return;
    writing.current = true;
    const context = epoch.current;
    const owner = user.uid;
    const f = new FormData(e.currentTarget);
    setError("");
    setSaved("");
    setBusy(true);
    const payload =
      action === "saveProfile"
        ? {
            displayName: f.get("displayName"),
            businessName: f.get("businessName"),
            marketingConsent: f.get("marketingConsent") === "on",
          }
        : {
            recipient: f.get("recipient"),
            phone: f.get("phone"),
            address: f.get("address"),
          };
    try {
      await callService("workspaceCommand", {
        action,
        operationId: crypto.randomUUID(),
        ...(action === "saveProfile" && version !== undefined
          ? { expectedVersion: version }
          : {}),
        payload,
      });
      if (
        context === epoch.current &&
        currentUid.current === owner &&
        auth?.currentUser?.uid === owner
      )
        setSaved(
          action === "saveProfile" ? "Đã lưu hồ sơ." : "Đã lưu địa chỉ.",
        );
    } catch {
      if (
        context === epoch.current &&
        currentUid.current === owner &&
        auth?.currentUser?.uid === owner
      )
        setError("Chưa lưu được thông tin. Kiểm tra kết nối và thử lại.");
    } finally {
      writing.current = false;
      if (
        context === epoch.current &&
        currentUid.current === owner &&
        auth?.currentUser?.uid === owner
      )
        setBusy(false);
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
    <section className="page profilePage" aria-labelledby="profileTitle">
      <header className="profileHeader">
        <div>
          <h1 id="profileTitle">Hồ sơ và địa chỉ</h1>
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
                  number === 1 ? "profilePersonalPanel" : "profileAddressPanel"
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
            id="profilePersonalPanel"
            hidden={step !== 1}
            className="form profileCard"
            onSubmit={(e) => void save(e, "saveProfile")}
            aria-labelledby="personalTitle"
          >
            <header className="profileCardHeading">
              <div>
                <h2 id="personalTitle">Thông tin cá nhân</h2>
                <p>Cập nhật tên và tùy chọn nhận thông tin.</p>
              </div>
            </header>
            {readStatus("profile", step === 1)}
            <fieldset
              disabled={busy || !visible.profileReady || visible.locked}
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
            id="profileAddressPanel"
            hidden={step !== 2}
            className="profileAddressColumn"
          >
            {!visible.profileReady && readStatus("profile", step === 2)}
            <section className="profileCard" aria-labelledby="addressesTitle">
              <header className="profileCardHeading">
                <div>
                  <h2 id="addressesTitle">Địa chỉ đã lưu</h2>
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
              aria-labelledby="newAddressTitle"
            >
              <header className="profileCardHeading">
                <div>
                  <h2 id="newAddressTitle">Thêm địa chỉ nhận hàng</h2>
                </div>
              </header>
              <fieldset
                disabled={
                  busy ||
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
          {error && (
            <p role="alert" className="profileNotice">
              {error}
            </p>
          )}
          {saved && <p role="status">{saved}</p>}
        </div>
      )}
      <footer className="profilePrivacy">
        <span>Dữ liệu cá nhân</span>
        <Link to="/support?topic=data-export">Yêu cầu xuất dữ liệu</Link>
        <Link to="/support?topic=data-deletion">Yêu cầu xóa dữ liệu</Link>
      </footer>
    </section>
  );
}
