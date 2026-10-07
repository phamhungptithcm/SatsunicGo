export const configured = !new URLSearchParams(location.search).has("off");
export const db = null;
export const doc = () => ({});
export const getDoc = async () => ({ data: () => null });
export const sendCommand = async () => {
  throw Error("Synthetic fixture must not submit orders");
};
export const callService = async () => {
  throw Error("Synthetic fixture must not upload");
};
