export const state = {
  fail: false,
  delay: 0,
  factors: (new URLSearchParams(window.location.search).has("enabled")
    ? [{}]
    : []) as unknown[],
  uri: "",
  enrolled: 0,
  qrFail: false,
  reloadFail: false,
  challenge: false,
  emptyChallenge: false,
};
Object.assign(window, { fixture: state });
export const user = {
  uid: "synthetic-security076",
  email: "fixture@example.invalid",
  reload: async () => {
    if (state.reloadFail) throw Error("synthetic reload");
  },
};
export function multiFactor() {
  return {
    enrolledFactors: state.factors,
    getSession: async () => ({}),
    enroll: async () => {
      if (state.fail) throw Error("synthetic");
      state.enrolled++;
      state.factors = [{}];
    },
  };
}
export class GoogleAuthProvider {}
export async function reauthenticateWithPopup() {}
export const TotpMultiFactorGenerator = {
  FACTOR_ID: "totp",
  generateSecret: async () => {
    await new Promise((r) => setTimeout(r, state.delay));
    return {
      secretKey: "JBSWY3DPEHPK3PXP",
      generateQrCodeUrl: (email: string, issuer: string) => {
        state.uri = `otpauth://totp/${issuer}:${email}?secret=JBSWY3DPEHPK3PXP&issuer=${issuer}`;
        return state.uri;
      },
    };
  },
  assertionForEnrollment: () => ({}),
};
export const auth = null;
export const captureMfa = () => false;
export const pendingMfa = () =>
  state.challenge
    ? {
        hints: state.emptyChallenge
          ? []
          : [
              {
                factorId: "totp",
                uid: "fixture-factor",
                displayName: "Ứng dụng xác thực",
              },
            ],
      }
    : null;
export const verifyMfa = async () => {
  if (state.fail) throw Error("synthetic code");
  state.challenge = false;
};
