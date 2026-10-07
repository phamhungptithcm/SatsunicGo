import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import type { Auth } from "firebase/auth";
import { LoginChallenge } from "../../../../src/features/auth/LoginChallenge";
import { captureMfa, pendingMfa } from "../../../../src/features/auth/mfa";
import "../../../../src/styles/global.css";
function Fixture() {
  const [message, setMessage] = useState("Chưa đăng nhập");
  function start() {
    captureMfa(
      {
        code: "auth/multi-factor-auth-required",
        customData: {
          operationType: "signIn",
          _serverResponse: {
            mfaPendingCredential: "synthetic-only",
            mfaInfo: [
              {
                mfaEnrollmentId: "fixture-factor",
                displayName: "Ứng dụng thử nghiệm",
                enrolledAt: "2026-10-06T00:00:00Z",
                totpInfo: {},
              },
            ],
          },
        },
      },
      {} as Auth,
    );
    const resolver = pendingMfa()!;
    resolver.resolveSignIn = async (assertion) => {
      const data = assertion as unknown as { otp: string };
      if (data.otp !== "654321")
        throw { code: "auth/invalid-verification-code" };
      setMessage("Đã đăng nhập · tiếp tục Studio");
      return {} as never;
    };
  }
  return (
    <main style={{ padding: 32 }}>
      <h1>Studio thử nghiệm</h1>
      <p>{message}</p>
      <button onClick={start}>Đăng nhập thử</button>
      <LoginChallenge onOpen={() => setMessage("Đang xác thực")} />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
