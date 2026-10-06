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
import { db, callService } from "../../shared/firebase";
import { initialProfileRead, profileReadReducer } from "./profile-state";
export function Profile({ user }: { user: User | null }) {
  const [read, dispatch] = useReducer(profileReadReducer, undefined, () =>
    initialProfileRead(user?.uid),
  );
  const { profile, version, addresses } = read;
  const setProfile = (value: typeof profile) =>
    dispatch({ type: "edit", uid: user?.uid ?? "", profile: value });
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const epoch = useRef(0),
    writing = useRef(false);
  useEffect(() => {
    epoch.current++;
    dispatch({ type: "reset", uid: user?.uid ?? "" });
    setError("");
    setSaved("");
    setBusy(false);
    if (!db || !user) return;
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
      read.locked ||
      writing.current ||
      read.uid !== user.uid ||
      !read.profileReady ||
      (action === "saveAddress" && !read.addressesReady)
    )
      return;
    writing.current = true;
    const context = epoch.current;
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
      if (context === epoch.current) setSaved("Đã lưu thông tin.");
    } catch (e) {
      if (context === epoch.current) setError((e as Error).message);
    } finally {
      writing.current = false;
      if (context === epoch.current) setBusy(false);
    }
  }
  return (
    <section className="page">
      <p>
        <Link to="/support?topic=data-export">
          Yêu cầu xuất dữ liệu cá nhân
        </Link>{" "}
        ·{" "}
        <Link to="/support?topic=data-deletion">
          Yêu cầu xóa dữ liệu cá nhân
        </Link>
      </p>
      <h1>Hồ sơ và địa chỉ</h1>
      {!user ? (
        <p className="notice">Đăng nhập để quản lý thông tin của bạn.</p>
      ) : (
        <div className="workColumns">
          <form
            className="form panel"
            onSubmit={(e) => void save(e, "saveProfile")}
          >
            <h2>Hồ sơ</h2>
            <fieldset
              disabled={busy || !read.profileReady || read.uid !== user?.uid}
            >
              <label>
                Tên hiển thị
                <input
                  name="displayName"
                  value={profile.displayName}
                  onChange={(e) =>
                    setProfile({ ...profile, displayName: e.target.value })
                  }
                  required
                  maxLength={120}
                />
              </label>
              <label>
                Tên hộ kinh doanh · không bắt buộc
                <input
                  name="businessName"
                  maxLength={160}
                  value={profile.businessName}
                  onChange={(e) =>
                    setProfile({ ...profile, businessName: e.target.value })
                  }
                />
              </label>
              <label>
                <span>
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
                  />{" "}
                  Nhận nội dung quảng bá qua kênh đã cấu hình
                </span>
              </label>
              <button className="primary" disabled={busy}>
                Lưu hồ sơ
              </button>
            </fieldset>
          </form>
          <div>
            <form
              key={`${user?.uid}:${read.locked}`}
              className="form panel"
              onSubmit={(e) => void save(e, "saveAddress")}
            >
              <h2>Địa chỉ nhận hàng mới</h2>
              <fieldset
                disabled={
                  busy ||
                  !read.profileReady ||
                  !read.addressesReady ||
                  read.uid !== user?.uid
                }
              >
                <label>
                  Người nhận
                  <input
                    name="recipient"
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </label>
                <label>
                  Số điện thoại
                  <input
                    name="phone"
                    type="tel"
                    minLength={8}
                    maxLength={20}
                    required
                  />
                </label>
                <label>
                  Địa chỉ
                  <textarea
                    name="address"
                    minLength={10}
                    maxLength={500}
                    required
                  />
                </label>
                <button className="primary" disabled={busy}>
                  Lưu địa chỉ
                </button>
              </fieldset>
            </form>
            {read.profileReady &&
              addresses.map((a) => (
                <article className="panel order" key={a.id}>
                  <strong>{a.recipient}</strong>
                  <p>{a.address}</p>
                </article>
              ))}
          </div>
        </div>
      )}
      {(read.profileError || read.addressesError) && (
        <div role="alert">
          <p>{read.profileError || read.addressesError}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRetry((n) => n + 1)}
          >
            Tải lại thông tin
          </button>
        </div>
      )}
      {!read.profileReady && !read.profileError && user && (
        <p role="status">Đang tải hồ sơ…</p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {saved && <p role="status">{saved}</p>}
    </section>
  );
}
