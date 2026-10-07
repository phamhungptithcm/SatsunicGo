export const db = {};
export const collection = () => ({});
export const query = () => ({});
export const where = () => ({});
export const limit = () => ({});
export const orderBy = () => ({});
const params = new URLSearchParams(location.search);
let read = false;
let emit: (() => void) | undefined;
export function onSnapshot(
  _q: unknown,
  success: (s: unknown) => void,
  failure: () => void,
) {
  const send = () =>
    success({
      docs: params.has("empty")
        ? []
        : [
            {
              id: "synthetic-1",
              data: () => ({
                action: "replyTicket",
                read,
                createdAt: 1791302400000,
              }),
            },
            {
              id: "synthetic-2",
              data: () => ({
                action: "unknown",
                read: true,
                createdAt: 1791298800000,
              }),
            },
          ],
    });
  emit = send;
  const timer = setTimeout(
    () => {
      if (params.has("error")) failure();
      else send();
    },
    params.has("loading") ? 10000 : 30,
  );
  return () => clearTimeout(timer);
}
export async function callService() {
  if (params.has("read-fail")) throw Error("synthetic");
  read = true;
  emit?.();
}
