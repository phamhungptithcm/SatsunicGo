import googleLogo from "./purchase-sign-in-assets/google-g.png";
import "./purchase-sign-in.css";

export function PurchaseSignIn({ signIn }: { signIn: () => void }) {
  return (
    <button className="purchaseGoogleSignIn" type="button" onClick={signIn}>
      <img src={googleLogo} width="20" height="20" alt="" />
      <span>Đăng nhập với Google</span>
    </button>
  );
}
