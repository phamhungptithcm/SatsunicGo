import { Link, NavLink } from "react-router-dom";
import type { User } from "firebase/auth";
import { configured } from "../shared/firebase";
export function SiteHeader({
  user,
  signIn,
  signOut,
  busy,
}: {
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <header className="topbar">
      <div className="navShell">
        <Link className="brand" to="/" aria-label="SatsunicGo — Trang chủ">
          Satsunic<span>Go</span>
          <i>by HunpeoLabs</i>
        </Link>
        <nav aria-label="Điều hướng chính">
          <NavLink to="/products">Sản phẩm</NavLink>
          <NavLink to="/how-it-works">Cách mua hộ</NavLink>
          <NavLink to="/fees">Biểu phí</NavLink>
          <NavLink to="/membership">Membership</NavLink>
          <NavLink to="/posts">Bài viết</NavLink>
          <NavLink to="/support">Hỗ trợ</NavLink>
        </nav>
        <div className="account">
          {user ? (
            <>
              <Link className="login" to="/account">
                Đơn của tôi
              </Link>
              <button
                className="textbutton"
                disabled={busy}
                onClick={() => void signOut()}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <button
              className="login"
              onClick={() => void signIn()}
              disabled={!configured || busy}
            >
              {busy ? "Đang đăng nhập…" : "Đăng nhập Google"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="footerGrid">
        <div className="footerIntro">
          <Link className="brand" to="/">
            Satsunic<span>Go</span>
          </Link>
          <p>
            Món bạn chọn ở Mỹ, Nhật, Hàn.
            <br />
            Một nơi để theo dõi hành trình về.
          </p>
          <Link className="footerCta" to="/request">
            Gửi yêu cầu mua hộ <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <nav aria-label="Khám phá">
          <h2>Khám phá</h2>
          <Link to="/products">Sản phẩm tham khảo</Link>
          <Link to="/posts">Bài viết</Link>
          <Link to="/membership">Membership</Link>
        </nav>
        <nav aria-label="Mua hộ">
          <h2>Mua hộ</h2>
          <Link to="/how-it-works">Cách hoạt động</Link>
          <Link to="/fees">Biểu phí</Link>
          <Link to="/account">Đơn của tôi</Link>
          <Link to="/support">Hỗ trợ</Link>
        </nav>
        <nav aria-label="Thông tin chính sách">
          <h2>Thông tin</h2>
          <Link to="/privacy">Quyền riêng tư</Link>
          <Link to="/terms">Điều khoản & hoàn tiền</Link>
          <Link to="/restricted">Hàng hạn chế</Link>
        </nav>
      </div>
      <div className="footerBottom">
        <span>SatsunicGo · by HunpeoLabs</span>
        <small>
          Phí và chính sách thương mại đang chờ đơn vị vận hành xác nhận.
        </small>
      </div>
    </footer>
  );
}
