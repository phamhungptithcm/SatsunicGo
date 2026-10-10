import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../shared/firebase";
/** Subscription has exactly the same owner boundary as the Account order listener. */
export function watchTrackingOrder(
  uid: string,
  orderId: string,
  revision: (version: number) => void,
  failure: () => void,
) {
  if (!db || auth?.currentUser?.uid !== uid) return () => {};
  return onSnapshot(
    doc(db, "orders", orderId),
    (snapshot) => {
      const value = snapshot.data();
      if (auth?.currentUser?.uid !== uid) return;
      if (
        !value ||
        value.ownerId !== uid ||
        !Number.isSafeInteger(value.version)
      ) {
        failure();
        return;
      }
      revision(value.version);
    },
    failure,
  );
}
