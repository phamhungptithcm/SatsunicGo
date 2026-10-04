import { Link } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
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
type ProfileValues = {
  displayName: string;
  businessName: string;
  marketingConsent: boolean;
};
export function Profile({ user }: { user: User | null }) {
  const [profile, setProfile] = useState<ProfileValues>({
    displayName: "",
    businessName: "",
    marketingConsent: false,
  });
  const [version, setVersion] = useState<number | undefined>(),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(""),
    [busy, setBusy] = useState(false),
    [addresses, setAddresses] = useState<
      { id: string; recipient: string; address: string }[]
    >([]);
  useEffect(() => {
    setAddresses([]);
    setVersion(undefined);
    if (!db || !user) return;
    const a = onSnapshot(
        doc(db, "users", user.uid),
        (s) => {
          const value = s.data();
          setVersion(value?.version);
          setProfile({
            displayName: value?.displayName ?? user.displayName ?? "",
            businessName: value?.businessName ?? "",
            marketingConsent: value?.marketingConsent === true,
          });
        },
        () => setError("Chưa tải được hồ sơ."),
      ),
      b = onSnapshot(
        query(
          collection(db, "addresses"),
          where("ownerId", "==", user.uid),
          limit(20),
        ),
        (s) =>
          setAddresses(
            s.docs.map(
              (d) => ({ ...d.data(), id: d.id }) as (typeof addresses)[number],
            ),
          ),
        () => setError("Chưa tải được địa chỉ."),
      );
    return () => {
      a();
      b();
    };
  }, [user]);
  async function save(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
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
      setSaved("Đã lưu thông tin.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
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
          </form>
          <div>
            <form
              className="form panel"
              onSubmit={(e) => void save(e, "saveAddress")}
            >
              <h2>Địa chỉ nhận hàng mới</h2>
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
            </form>
            {addresses.map((a) => (
              <article className="panel order" key={a.id}>
                <strong>{a.recipient}</strong>
                <p>{a.address}</p>
              </article>
            ))}
          </div>
        </div>
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
