import { HttpsError } from "firebase-functions/v2/https";

// Smooth same-instance bursts; Firestore transactions remain the cross-instance authority.
// No result cache, timers or retained customer data. Both keys and waiters are bounded.
const lanes = new Map<string, { tail: Promise<void>; pending: number }>();
export async function withPurchaseMutation<T>(
  key: string,
  work: () => Promise<T>,
): Promise<T> {
  let lane = lanes.get(key);
  if ((!lane && lanes.size >= 64) || (lane && lane.pending >= 16))
    throw new HttpsError(
      "resource-exhausted",
      "Có nhiều thao tác đang xử lý. Kiểm tra lại cùng lượt thanh toán sau.",
    );
  if (!lane) {
    lane = { tail: Promise.resolve(), pending: 0 };
    lanes.set(key, lane);
  }
  const previous = lane.tail;
  let release!: () => void;
  lane.tail = new Promise<void>((resolve) => {
    release = resolve;
  });
  lane.pending++;
  await previous;
  try {
    return await work();
  } finally {
    lane.pending--;
    release();
    if (!lane.pending) lanes.delete(key);
  }
}
