import { describe, expect, it } from "vitest";
import {
  googleAvatarUrl,
  invitationCommand,
  invitationEmail,
  invitationId,
  invitationState,
  INVITATION_TTL,
  type StaffInvitation,
} from "../../packages/domain/staff-invitation";
import { staffInvitationMessage } from "../../functions/src/staff-invitation-email";
const id = "6d654e4f-788c-44a1-ae60-7ba487f9c961";
describe("staff invitation boundaries", () => {
  it("normalizes case/whitespace but does not merge Gmail aliases", () => {
    expect(invitationEmail.parse("  Person.Name+team@GMAIL.COM ")).toBe(
      "person.name+team@gmail.com",
    );
    expect(invitationEmail.parse("personname@gmail.com")).not.toBe(
      invitationEmail.parse("person.name@gmail.com"),
    );
    expect(invitationEmail.parse("employee@company.com")).toBe(
      "employee@company.com",
    );
  });
  it("rejects invalid addresses, unbounded input and control characters", () => {
    for (const email of [
      "",
      "not-email",
      "name@gmail.com\r\nBcc:other@example.invalid",
      "x".repeat(255) + "@gmail.com",
    ])
      expect(invitationEmail.safeParse(email).success).toBe(false);
  });
  it("strictly rejects client roles, UIDs and unknown fields", () => {
    expect(
      invitationCommand.safeParse({
        action: "create",
        email: "a@gmail.com",
        operationId: id,
        roles: ["OWNER"],
      }).success,
    ).toBe(false);
    expect(
      invitationCommand.safeParse({ action: "accept", id, uid: "other" })
        .success,
    ).toBe(false);
    expect(invitationId.safeParse("../private").success).toBe(false);
  });
  it("requires optimistic version for resend and revoke", () => {
    expect(
      invitationCommand.safeParse({ action: "resend", id, operationId: id })
        .success,
    ).toBe(false);
    expect(
      invitationCommand.safeParse({
        action: "revoke",
        id,
        operationId: id,
        version: 1,
      }).success,
    ).toBe(true);
  });
  it("expires pending invitations exactly at the deadline without expiring accepted members", () => {
    const value = {
      state: "pending",
      expiresAt: INVITATION_TTL,
    } as StaffInvitation;
    expect(invitationState(value, INVITATION_TTL - 1)).toBe("pending");
    expect(invitationState(value, INVITATION_TTL)).toBe("expired");
    expect(
      invitationState({ ...value, state: "accepted" }, INVITATION_TTL + 1),
    ).toBe("accepted");
  });
  it("email contains an opaque link and no automatic acceptance or role promise", () => {
    const message = staffInvitationMessage(
      id,
      "test@example.invalid",
      "contact@hunpeolabs.com",
    );
    expect(message.html).toContain(`/join-staff?id=${id}`);
    expect(message.html).not.toContain("test@example.invalid");
    expect(message.text).toContain("chủ doanh nghiệp sẽ phân quyền");
    expect(message.html).not.toContain("acceptStaffInvitation");
  });
});

it("only renders bounded HTTPS Google avatar URLs", () => {
  expect(
    googleAvatarUrl("https://lh3.googleusercontent.com/a/avatar=s96-c"),
  ).toBe("https://lh3.googleusercontent.com/a/avatar=s96-c");
  expect(googleAvatarUrl("https://lh5.ggpht.com/avatar")).toBeTruthy();
  for (const value of [
    null,
    "javascript:alert(1)",
    "http://lh3.googleusercontent.com/a",
    "https://googleusercontent.com.attacker.invalid/a",
    "https://user:password@lh3.googleusercontent.com/a",
    "https://example.invalid/avatar",
    "https://lh3.googleusercontent.com:8443/a",
    "x".repeat(2049),
  ])
    expect(googleAvatarUrl(value)).toBeNull();
});
