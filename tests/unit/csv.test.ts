import { expect, test } from "vitest";
import { importItemsCsv } from "../../packages/domain/csv";
test("imports quoted commas and escaped quotes without losing variants", () => {
  const rows = importItemsCsv(
    'name,url,quantity,variant\r\n"Camera, compact",,2,"Black ""Pro"""\r\n',
  );
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    name: "Camera, compact",
    quantity: 2,
    variant: 'Black "Pro"',
  });
});
test("rejects malformed, unbounded and invalid quantity imports", () => {
  for (const text of [
    'name,url,quantity,variant\n"unfinished,,,',
    "name,url,quantity,variant\nx,,0,black",
    "other,headers\nx,y",
    "x".repeat(50001),
  ])
    expect(() => importItemsCsv(text)).toThrow();
});
