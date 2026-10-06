export type ProfileValues = {
  displayName: string;
  businessName: string;
  marketingConsent: boolean;
};
export type Address = { id: string; recipient: string; address: string };
export type ProfileReadState = {
  uid: string;
  locked: boolean;
  profile: ProfileValues;
  version?: number;
  addresses: Address[];
  profileReady: boolean;
  addressesReady: boolean;
  profileError: string;
  addressesError: string;
};
export const emptyProfile: ProfileValues = {
  displayName: "",
  businessName: "",
  marketingConsent: false,
};
export function initialProfileRead(uid = ""): ProfileReadState {
  return {
    uid,
    locked: false,
    profile: { ...emptyProfile },
    addresses: [],
    profileReady: false,
    addressesReady: false,
    profileError: "",
    addressesError: "",
  };
}
export type ProfileReadAction =
  | { type: "reset"; uid: string }
  | { type: "locked"; uid: string }
  | { type: "profile"; uid: string; profile: ProfileValues; version?: number }
  | { type: "addresses"; uid: string; addresses: Address[] }
  | { type: "profile-error" | "addresses-error"; uid: string }
  | { type: "edit"; uid: string; profile: ProfileValues };
export function profileReadReducer(
  state: ProfileReadState,
  action: ProfileReadAction,
): ProfileReadState {
  if (action.type === "reset") return initialProfileRead(action.uid);
  if (action.uid !== state.uid) return state;
  if (action.type === "locked")
    return {
      ...initialProfileRead(state.uid),
      locked: true,
      profileError:
        "Tài khoản đang bị khóa. Bạn chưa thể xem hoặc cập nhật hồ sơ và địa chỉ.",
    };
  if (state.locked) return state;
  switch (action.type) {
    case "profile":
      return {
        ...state,
        profile: action.profile,
        version: action.version,
        profileReady: true,
        profileError: "",
      };
    case "addresses":
      return {
        ...state,
        addresses: action.addresses,
        addressesReady: true,
        addressesError: "",
      };
    case "profile-error":
      return {
        ...state,
        profile: { ...emptyProfile },
        version: undefined,
        profileReady: false,
        profileError: "Chưa tải được hồ sơ. Kiểm tra kết nối và thử lại.",
      };
    case "addresses-error":
      return {
        ...state,
        addresses: [],
        addressesReady: false,
        addressesError: "Chưa tải được địa chỉ. Kiểm tra kết nối và thử lại.",
      };
    case "edit":
      return state.profileReady ? { ...state, profile: action.profile } : state;
  }
}
