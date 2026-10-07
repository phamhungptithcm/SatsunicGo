import { test, expect } from "@playwright/test";

// Presentation evidence only: existing demo identity, intercepted callable reads,
// no Firestore fixture writes and no business mutations to the shared emulator.
test("shipping094: separated queues, retained drafts, responsive forms and recovery", async ({
  page,
}) => {
  const errors: string[] = [];
  let unexpectedConsoleErrors = 0;
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().startsWith("Failed to load resource:")
    )
      unexpectedConsoleErrors++;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  let mode: "empty" | "populated" | "error" | "denied" = "empty";
  let delay = false;
  const reads: { kind: string; after?: string; id?: string }[] = [];
  const order = {
    id: `synthetic-order094-${"x".repeat(61)}`,
    version: 1,
    ownerId: "synthetic094",
    items: [{ name: "Sản phẩm kiểm thử", variant: "Màu xanh", quantity: 2 }],
    market: "US",
    notes: "",
    stage: "READY_TO_SHIP",
    createdAt: 1,
    collected: 100000,
    refunded: 0,
    finalTotal: 100000,
    finalApproved: true,
    packingComplete: true,
    packedQuantity: 2,
  };
  const parcel = {
    id: `synthetic-parcel094-${"x".repeat(60)}`,
    version: 1,
    state: "packed",
    warehouse: "Kho kiểm thử",
    route: "US-VN",
    weightGrams: 250,
    allocations: [{ orderId: order.id, line: 0, quantity: 1 }],
  };
  const batch = {
    id: "synthetic-batch094",
    version: 1,
    state: "sealed",
    warehouse: parcel.warehouse,
    route: parcel.route,
    hub: "Hub kiểm thử",
    service: "Dịch vụ kiểm thử",
    cutoff: 1791500000000,
    freight: 100000,
    shares: { [order.id]: 100000 },
    orderIds: [order.id],
    parcelIds: [parcel.id],
  };
  await page.route("**/listWork", async (route) => {
    const data = route.request().postDataJSON().data;
    reads.push(data);
    if (delay) await new Promise((resolve) => setTimeout(resolve, 700));
    if (mode === "error" || mode === "denied") {
      await route.fulfill({
        status: mode === "denied" ? 403 : 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            status: mode === "denied" ? "PERMISSION_DENIED" : "UNAVAILABLE",
            message: "Synthetic094",
          },
        }),
      });
      return;
    }
    const rows =
      mode === "empty"
        ? []
        : data.kind === "orders"
          ? [order]
          : data.kind === "packages"
            ? [parcel]
            : data.kind === "consolidationBatches"
              ? [batch]
              : [];
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          rows,
          next:
            mode === "populated" && !data.id && !data.after
              ? "synthetic-next094"
              : null,
        },
      }),
    });
  });
  // Commands are intercepted; no business mutation reaches the shared emulator.
  const issuedCommands: Record<string, unknown>[] = [];
  await page.route(
    /\/(shippingCommand|consolidationCommand)$/,
    async (route) => {
      issuedCommands.push(route.request().postDataJSON().data);
      if (issuedCommands.length === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              status: "UNAVAILABLE",
              message: "Synthetic094 unknown result",
            },
          }),
        });
      } else {
        parcel.state = "in_transit";
        parcel.version = 2;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ result: { id: parcel.id, version: 2 } }),
        });
      }
    },
  );
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption("owner");
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  await page.goto("/crm/shipping");
  await expect(
    page.getByRole("heading", { name: "Kiện & vận chuyển", exact: true }),
  ).toBeVisible();
  const parcels = page.getByRole("tabpanel", {
    name: "Kiện hàng",
    exact: true,
  });
  const batches = page.getByRole("tabpanel", {
    name: "Lô gom & cước",
    exact: true,
  });
  await expect(
    parcels.getByRole("heading", { name: "Chưa có kiện trong trang này" }),
  ).toBeVisible();
  await expect(batches).toBeHidden();
  await parcels.getByRole("button", { name: "Tạo kiện", exact: true }).click();
  const pack = parcels.locator('form[data-intent="pack"]');
  await pack.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(pack.getByRole("alert")).toContainText("Chọn ít nhất");
  mode = "populated";
  delay = true;
  await parcels
    .getByRole("button", { name: "Tải lại kiện", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Lô gom & cước", exact: true }),
  ).toBeDisabled();
  await expect(pack.locator(".shippingSelectionList input")).toBeEnabled();
  delay = false;
  await pack.locator(".shippingSelectionList input").check();
  await expect(
    pack.getByText("Đã chọn 1/10 đơn", { exact: true }),
  ).toBeVisible();
  await pack.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await pack.getByLabel(/Sản phẩm kiểm thử/).fill("1");
  await pack.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await pack.getByLabel("Kho nguồn").fill("Bản nháp kho094");
  await pack.getByLabel("Tuyến và hub đích").fill("Tuyến nháp094");
  await pack.getByLabel("Khối lượng (g)").fill("250");
  for (const label of ["Dài (cm)", "Rộng (cm)", "Cao (cm)"])
    await pack.getByLabel(label).fill("10");
  await pack.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await pack.getByLabel("Bằng chứng kiểm/đóng gói").fill("Bằng chứng nháp094");
  await expect(
    pack.getByRole("button", { name: "Tạo kiện nội bộ", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/shipping094/desktop-form.png",
    fullPage: true,
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/private/tmp/shipping094/mobile-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("tab", { name: "Kiện hàng", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Lô gom & cước", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await batches
    .getByRole("button", { name: "Tải lại lô gom", exact: true })
    .click();
  await batches
    .getByRole("button", { name: "Tạo lô gom", exact: true })
    .click();
  const seal = batches.locator('form[data-intent="seal"]');
  await seal.getByRole("checkbox", { name: new RegExp(parcel.id) }).check();
  await expect(
    seal.getByText("Đã chọn 1/20 kiện · 1/10 đơn", { exact: true }),
  ).toBeVisible();
  await seal.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await seal
    .getByLabel(`Khối lượng phân bổ cho đơn ${order.id} (g)`)
    .fill("250");
  await seal.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await seal.getByLabel("Hub đích").fill("Hub nháp094");
  await seal.getByLabel("Tổng cước quốc tế (₫)").fill("120000");
  await batches
    .getByRole("button", { name: "Trang lô sau", exact: true })
    .click();
  await expect(
    batches.getByText("Trang 2 · 1 lô trong trang", { exact: true }),
  ).toBeVisible();
  expect(reads.at(-1)?.kind).toBe("consolidationBatches");
  await page.getByRole("tab", { name: "Lô gom & cước", exact: true }).focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await parcels.getByRole("button", { name: "Tạo kiện", exact: true }).click();
  await pack.getByRole("button", { name: "← Quay lại", exact: true }).click();
  await expect(pack.getByLabel("Kho nguồn")).toHaveValue("Bản nháp kho094");
  await pack.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(pack.getByLabel("Bằng chứng kiểm/đóng gói")).toHaveValue(
    "Bằng chứng nháp094",
  );
  await parcels
    .getByRole("button", { name: "Trang kiện sau", exact: true })
    .click();
  await expect(
    parcels.getByText("Trang 2 · 1 kiện trong trang", { exact: true }),
  ).toBeVisible();
  expect(reads.at(-1)?.kind).toBe("packages");
  mode = "error";
  await parcels
    .getByRole("button", { name: "Tải lại kiện", exact: true })
    .click();
  await expect(
    parcels.getByText("Chưa tải được hàng đợi kiện", { exact: true }),
  ).toBeVisible();
  await expect(
    pack.getByRole("button", { name: "Tạo kiện nội bộ", exact: true }),
  ).toBeDisabled();
  mode = "populated";
  await parcels
    .getByRole("button", { name: "Đối chiếu dữ liệu kiện", exact: true })
    .click();
  await expect(
    pack.getByRole("button", { name: "Tạo kiện nội bộ", exact: true }),
  ).toBeEnabled();
  await parcels.getByText("Bàn giao kiện", { exact: true }).click();
  const handoff = parcels.locator(`form[data-intent="dispatch:${parcel.id}"]`);
  await handoff.getByLabel("Hãng vận chuyển").fill("Hãng kiểm thử");
  await handoff.getByLabel("Mã vận đơn").fill("SYNTHETIC094");
  await handoff
    .getByLabel("Bằng chứng bàn giao")
    .fill("Bằng chứng kiểm thử094");
  await handoff
    .getByRole("button", { name: "Xác nhận bàn giao xuất gửi", exact: true })
    .click();
  const retry = parcels.getByRole("button", {
    name: "Thử lại thao tác đã gửi",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Lô gom & cước", exact: true }),
  ).toBeDisabled();
  await expect(handoff.getByLabel("Mã vận đơn")).toHaveValue("SYNTHETIC094");
  await retry.click();
  const saved = parcels.getByRole("region", {
    name: "Kiện vừa lưu",
    exact: true,
  });
  await expect(saved).toBeVisible();
  await expect(saved).toBeFocused();
  expect(issuedCommands).toHaveLength(2);
  expect(issuedCommands[1]).toEqual(issuedCommands[0]);
  expect(issuedCommands[0].action).toBe("dispatchParcel");
  expect(issuedCommands[0].orderVersions).toEqual({ [order.id]: 1 });
  await expect(
    parcels.getByRole("button", { name: "Tải lại kiện", exact: true }),
  ).toBeEnabled();
  mode = "denied";
  await parcels
    .getByRole("button", { name: "Tải lại kiện", exact: true })
    .click();
  await expect(
    page.getByText(
      "Không có quyền xem dữ liệu này. Đối chiếu lại sau khi được cấp quyền.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(unexpectedConsoleErrors).toBe(0);
  expect(issuedCommands).toHaveLength(2);
});
