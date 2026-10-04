export function recentMfa(
  token: {
    auth_time?: unknown;
    firebase?: { sign_in_second_factor?: unknown };
  },
  now: number,
) {
  const seconds = Number(token.auth_time);
  return (
    Number.isSafeInteger(seconds) &&
    seconds > 0 &&
    seconds * 1000 <= now + 30000 &&
    now - seconds * 1000 < 300000 &&
    typeof token.firebase?.sign_in_second_factor === "string" &&
    token.firebase.sign_in_second_factor.length > 0
  );
}
