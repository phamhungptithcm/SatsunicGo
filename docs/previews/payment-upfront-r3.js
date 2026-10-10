const $ = (id) => document.getElementById(id);
const money = (v) => new Intl.NumberFormat("vi-VN").format(v) + " ₫";
let valid = true,
  step = 0,
  reached = 0,
  amount = 3045000,
  catalogAmount = 1650000;
let checkoutStep = 0,
  checkoutReached = 0,
  additionalHeld = false,
  mode = "initial";
let cart = [],
  serial = 0,
  attempt = null;
const wards = {
  hcm: ["Phường Bến Thành", "Phường Sài Gòn"],
  hanoi: ["Phường Hoàn Kiếm", "Phường Cửa Nam"],
};
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function show(id, focusPanel = false) {
  document
    .querySelectorAll(".previewPanel")
    .forEach((el) => (el.hidden = el.id !== id));
  document.querySelectorAll("[data-panel]").forEach((el) => {
    el.setAttribute("aria-selected", String(el.dataset.panel === id));
    el.tabIndex = el.dataset.panel === id ? 0 : -1;
  });
  if (focusPanel) {
    const title = $(id).querySelector("h1,h2") ?? $(id);
    title.tabIndex = -1;
    title.focus();
  }
}
const tabs = [...document.querySelectorAll("[data-panel]")];
tabs.forEach((b, i) => {
  b.addEventListener("click", () => show(b.dataset.panel));
  b.addEventListener("keydown", (event) => {
    let target;
    if (event.key === "ArrowRight") target = (i + 1) % tabs.length;
    if (event.key === "ArrowLeft") target = (i - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = tabs.length - 1;
    if (target !== undefined) {
      event.preventDefault();
      tabs[target].focus();
      tabs[target].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });
});
document.querySelectorAll("[data-go]").forEach((b) =>
  b.addEventListener("click", (e) => {
    e.preventDefault();
    show(b.dataset.go, true);
    closeMenu();
  }),
);
$("headerCart").addEventListener("click", () => {
  renderCart();
  show("cart", true);
});
function update() {
  const value = $("price").value,
    q = Number($("quantity").value);
  const priceOk =
    /^\d+(\.\d{1,2})?$/.test(value) &&
    Number(value) > 0 &&
    Number(value) <= 1000000;
  const quantityOk = Number.isSafeInteger(q) && q >= 1 && q <= 100;
  const productOk = $("product").value.trim().length > 0;
  valid = priceOk && quantityOk && productOk;
  [
    ["product", productOk],
    ["price", priceOk],
    ["quantity", quantityOk],
  ].forEach(([id, ok]) => {
    $(id + "error").hidden = ok;
    $(id).setAttribute("aria-invalid", String(!ok));
  });
  $("totalerror").hidden = true;
  if (valid) {
    const [whole, fraction = ""] = value.split(".");
    const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    const goods = Number((cents * BigInt(q) * 25000n + 99n) / 100n),
      fee = Math.ceil(goods / 20);
    amount = goods + fee;
    if (amount > 1000000000000) {
      valid = false;
      $("totalerror").hidden = false;
    } else {
      $("goods").textContent = money(goods);
      $("fee").textContent = money(fee);
      $("initialtotal").textContent = money(amount);
    }
  }
  if (!valid)
    ["goods", "fee", "initialtotal"].forEach(
      (id) => ($(id).textContent = "Chưa tính được"),
    );
  $("start").disabled = !valid;
  $("next").disabled = !valid;
}
function moveStep(target) {
  if (target > step && !valid) {
    $("draftStatus").textContent =
      "Kiểm tra tên sản phẩm, giá và số lượng trước khi tiếp tục.";
    return;
  }
  step = target;
  reached = Math.max(reached, target);
  document
    .querySelectorAll("[data-stage]")
    .forEach((el) => (el.hidden = Number(el.dataset.stage) !== step));
  document.querySelectorAll("[data-step]").forEach((el) => {
    const n = Number(el.dataset.step);
    el.disabled = n > reached;
    el.className = n === step ? "isCurrent" : n < step ? "isComplete" : "";
    if (n === step) el.setAttribute("aria-current", "step");
    else el.removeAttribute("aria-current");
    el.querySelector("small").textContent =
      n === step ? "Đang nhập" : n < step ? "Đã kiểm tra bước" : "";
  });
  $("stageTitle").textContent = [
    "Món hàng",
    "Thông tin thêm",
    "Kiểm tra trước khi thêm vào giỏ",
  ][step];
  $("back").hidden = step === 0;
  $("next").hidden = step === 2;
  $("start").hidden = step !== 2;
  $("next").textContent =
    step === 0 ? "Thông tin thêm →" : "Kiểm tra yêu cầu →";
  $("reviewProduct").textContent = $("product").value.trim();
  $("reviewChoice").textContent =
    $("quantity").value +
    " chiếc · " +
    ($("variant").value || "Chưa ghi mẫu") +
    " · " +
    $("condition").selectedOptions[0].text;
  $("reviewPrice").textContent = $("price").value + " USD / chiếc";
  const extras = [];
  if ($("notes").value.trim())
    extras.push("Ghi chú: " + $("notes").value.trim());
  if ($("store").value.trim())
    extras.push("Cửa hàng: " + $("store").value.trim());
  if ($("budget").value)
    extras.push("Ngân sách tham khảo: " + money(Number($("budget").value)));
  if ($("desired").value)
    extras.push(
      "Ngày mong muốn: " + $("desired").value + " · Cần nhân viên xác nhận.",
    );
  $("reviewExtras").textContent =
    extras.join(" · ") || "Không có thông tin thêm.";
  $("stageTitle").focus();
}
$("requestDraft").addEventListener("submit", (e) => e.preventDefault());
$("next").addEventListener("click", () => moveStep(step + 1));
$("back").addEventListener("click", () => moveStep(step - 1));
document
  .querySelectorAll("[data-step]")
  .forEach((b) =>
    b.addEventListener("click", () => moveStep(Number(b.dataset.step))),
  );
document
  .querySelectorAll("[data-edit]")
  .forEach((b) =>
    b.addEventListener("click", () => moveStep(Number(b.dataset.edit))),
  );
[
  "price",
  "quantity",
  "product",
  "variant",
  "condition",
  "notes",
  "store",
  "budget",
  "desired",
].forEach((id) => $(id).addEventListener("input", update));
$("catalogLink").addEventListener("click", (e) => {
  e.preventDefault();
  show("catalog", true);
});
const menu = document.querySelector(".menuToggle");
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Mở điều hướng");
  $("primary-navigation").dataset.open = "false";
}
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Đóng điều hướng" : "Mở điều hướng");
  $("primary-navigation").dataset.open = String(open);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest(".topbar")) closeMenu();
});
function priceLine(line) {
  if (line.kind === "catalog")
    return {
      goods: line.unit * line.quantity,
      fee: 0,
      total: line.unit * line.quantity,
    };
  const goods = Number(
      (BigInt(line.cents) * BigInt(line.quantity) * 25000n + 99n) / 100n,
    ),
    fee = Math.ceil(goods / 20);
  return { goods, fee, total: goods + fee };
}
function selected() {
  return cart.filter((x) => x.selected);
}
function sums() {
  return selected().reduce(
    (s, x) => {
      const p = priceLine(x);
      s.total += p.total;
      s.listed += x.kind === "catalog" ? p.total : 0;
      s.goods += x.kind === "custom" ? p.goods : 0;
      s.fee += p.fee;
      s.qty += x.quantity;
      return s;
    },
    { total: 0, listed: 0, goods: 0, fee: 0, qty: 0 },
  );
}
function invalidate() {
  $("checkoutConsent").checked = false;
  checkoutReached = 0;
  checkoutStep = 0;
  renderCart();
  renderCheckout(false);
}
function addLine(line) {
  const same = cart.find(
    (x) =>
      x.kind === line.kind &&
      x.name === line.name &&
      x.variant === line.variant &&
      x.cents === line.cents &&
      x.notes === line.notes &&
      x.condition === line.condition &&
      x.store === line.store &&
      x.budget === line.budget &&
      x.desired === line.desired,
  );
  if (
    same &&
    attempt &&
    ["pending", "unknown"].includes(attempt.state) &&
    attempt.lines.some((x) => x.id === same.id)
  ) {
    show("cart", true);
    $("cartMessage").textContent =
      "Món này đang chờ xác minh thanh toán. Kiểm tra lần đã tạo trước khi thêm cùng món.";
    return;
  }
  if (
    (same && same.quantity + line.quantity > 100) ||
    (!same && cart.length >= 30)
  ) {
    show("cart", true);
    $("cartMessage").textContent =
      "Giỏ tối đa 30 dòng, mỗi dòng tối đa 100 món. Giảm số lượng hoặc chỉnh giỏ để thêm.";
    return;
  }
  if (same) {
    same.quantity += line.quantity;
    same.selected = true;
  } else cart.push({ ...line, id: ++serial, selected: true });
  invalidate();
  show("cart", true);
  $("cartMessage").textContent =
    "Đã thêm vào giỏ mẫu. Chọn các món để tiếp tục nhận hàng và checkout.";
}
$("start").addEventListener("click", () => {
  if (!valid || step !== 2) return;
  const [whole, frac = ""] = $("price").value.split(".");
  addLine({
    kind: "custom",
    requiresSourcing: true,
    name: $("product").value.trim(),
    variant: $("variant").value,
    quantity: Number($("quantity").value),
    cents: Number(BigInt(whole) * 100n + BigInt(frac.padEnd(2, "0"))),
    condition: $("condition").value,
    notes: $("notes").value,
    store: $("store").value,
    budget: $("budget").value,
    desired: $("desired").value,
  });
});
function updateCatalog() {
  const q = Number($("catalogQty").value),
    ok = Number.isSafeInteger(q) && q >= 1 && q <= 100;
  $("catalogQty").setAttribute("aria-invalid", String(!ok));
  $("catalogerror").hidden = ok;
  $("catalogPay").disabled = !ok;
  catalogAmount = ok ? q * 1650000 : null;
  $("catalogtotal").textContent = ok ? money(catalogAmount) : "Chưa tính được";
  $("catalogSummary").textContent = ok
    ? q + " chiếc · " + $("catalogVariant").value
    : "Chưa xác định số lượng";
}
$("catalogQty").addEventListener("input", updateCatalog);
$("catalogVariant").addEventListener("change", updateCatalog);
$("catalogPay").addEventListener("click", () => {
  if (catalogAmount !== null)
    addLine({
      kind: "catalog",
      requiresSourcing: false,
      name: "Tai nghe không dây · phiên bản niêm yết",
      variant: $("catalogVariant").value,
      quantity: Number($("catalogQty").value),
      unit: 1650000,
    });
});
function allocation(container, lines) {
  container.replaceChildren();
  lines.forEach((x) => {
    const row = node("div", undefined, "allocationLine");
    row.append(
      node(
        "span",
        x.name +
          " · " +
          x.quantity +
          " chiếc · " +
          (x.kind === "custom" ? "Cần tìm mua" : "Giá niêm yết"),
      ),
      node("strong", money(priceLine(x).total)),
    );
    container.append(row);
  });
}
function renderCart() {
  $("cartLines").replaceChildren();
  $("emptyCart").hidden = cart.length > 0;
  $("cartCount").textContent = String(cart.reduce((n, x) => n + x.quantity, 0));
  cart.forEach((line) => {
    const reserved =
      attempt &&
      ["pending", "unknown"].includes(attempt.state) &&
      attempt.lines.some((x) => x.id === line.id);
    const row = node("article", undefined, "cartLine");
    row.dataset.line = String(line.id);
    const choose = node("input");
    choose.type = "checkbox";
    choose.checked = line.selected;
    choose.disabled = !!reserved;
    choose.setAttribute("aria-label", "Chọn " + line.name);
    choose.addEventListener("change", () => {
      line.selected = choose.checked;
      invalidate();
    });
    const body = node("div"),
      label = node(
        "span",
        line.requiresSourcing ? "Cần tìm mua" : "Giá niêm yết",
        line.requiresSourcing ? "tag tagblue" : "tag",
      );
    body.append(
      label,
      node("h3", line.name),
      node("p", line.variant || "Không ghi mẫu", "hint"),
      node(
        "p",
        line.kind === "custom"
          ? "Giá bạn tìm hiểu: " +
              new Intl.NumberFormat("vi-VN").format(line.cents / 100) +
              " USD / món · Vận chuyển chưa chốt"
          : "Giá trọn gói: " + money(line.unit) + " / món",
        "hint",
      ),
    );
    if (reserved) {
      body.append(
        node("p", "Đang chờ xác minh thanh toán · món tạm khóa", "hint"),
      );
      const resume = node(
        "button",
        "Tiếp tục kiểm tra thanh toán",
        "textbutton",
      );
      resume.type = "button";
      resume.addEventListener("click", () => show("payment", true));
      body.append(resume);
    }
    const controls = node("div", undefined, "lineControls"),
      qtyLabel = node("label", "Số lượng"),
      qty = node("input");
    qty.type = "number";
    qty.min = "1";
    qty.max = "100";
    qty.step = "1";
    qty.value = String(line.quantity);
    qty.setAttribute("aria-label", "Số lượng " + line.name);
    qty.disabled = !!reserved;
    qty.addEventListener("change", () => {
      const n = Number(qty.value);
      if (!Number.isSafeInteger(n) || n < 1 || n > 100) {
        qty.value = String(line.quantity);
        $("cartMessage").textContent =
          "Số lượng cần là số nguyên từ 1 đến 100. Giỏ giữ số lượng trước đó.";
        return;
      }
      line.quantity = n;
      invalidate();
    });
    qtyLabel.append(qty);
    const remove = node("button", "Xóa", "textbutton");
    remove.type = "button";
    remove.setAttribute("aria-label", "Xóa " + line.name);
    remove.addEventListener("click", () => {
      cart = cart.filter((x) => x.id !== line.id);
      invalidate();
      $("cartMessage").textContent = "Đã xóa món khỏi giỏ mẫu.";
      $("checkoutHeading").focus();
    });
    remove.disabled = !!reserved;
    controls.append(
      qtyLabel,
      remove,
      node("strong", money(priceLine(line).total)),
    );
    body.append(controls);
    row.append(choose, body);
    $("cartLines").append(row);
  });
  renderTotals();
}
function renderTotals() {
  const s = sums();
  $("selectedCount").textContent =
    selected().length + " dòng · " + s.qty + " món";
  $("listedTotal").textContent = money(s.listed);
  $("customGoods").textContent = money(s.goods);
  $("customFee").textContent = money(s.fee);
  $("shippingStatus").textContent =
    selected().length === 0
      ? "Chưa chọn món"
      : selected().some((x) => x.kind === "custom")
        ? "Chưa chốt"
        : "Đã gồm trong giá niêm yết";
  $("cartTotal").textContent = money(s.total);
}
function populateWards() {
  const p = $("province").value;
  $("ward").replaceChildren(
    new Option(p ? "Chọn phường / xã" : "Chọn tỉnh / thành phố trước", ""),
  );
  (wards[p] ?? []).forEach((w) => $("ward").append(new Option(w, w)));
  $("ward").disabled = !p;
}
$("province").addEventListener("change", () => {
  populateWards();
  $("checkoutConsent").checked = false;
});
$("savedAddress").addEventListener("change", () => {
  if ($("savedAddress").value !== "sample") return;
  $("recipientName").value = "Khách hàng minh họa";
  $("recipientPhone").value = "0900000000";
  $("province").value = "hcm";
  populateWards();
  $("ward").value = "Phường Bến Thành";
  $("street").value = "Địa chỉ minh họa · số 10, đường mẫu";
  $("deliveryNote").value = "";
  $("checkoutConsent").checked = false;
});
$("recipientForm").addEventListener("submit", (e) => e.preventDefault());
$("recipientForm").addEventListener("input", () => {
  $("checkoutConsent").checked = false;
});
function recipient(check = true) {
  const data = {
    name: $("recipientName").value.trim(),
    phone: $("recipientPhone").value.trim(),
    province: $("province").value,
    ward: $("ward").value,
    street: $("street").value.trim(),
    note: $("deliveryNote").value.trim(),
  };
  const errors = [];
  if (data.name.length < 2) errors.push("Nhập tên người nhận.");
  if (!/^(0[0-9]{9}|\+84[0-9]{9})$/.test(data.phone))
    errors.push(
      "Nhập số điện thoại Việt Nam dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.",
    );
  if (!data.province || !wards[data.province]?.includes(data.ward))
    errors.push("Chọn tỉnh / thành phố và phường / xã tương ứng.");
  if (data.street.length < 5)
    errors.push("Nhập số nhà và đường hoặc thông tin tòa nhà / căn hộ.");
  if (check) {
    $("recipientError").hidden = errors.length === 0;
    $("recipientError").textContent = errors.join(" ");
    [
      ["recipientName", data.name.length >= 2],
      ["recipientPhone", /^(0[0-9]{9}|\+84[0-9]{9})$/.test(data.phone)],
      ["province", !!data.province],
      ["ward", !!wards[data.province]?.includes(data.ward)],
      ["street", data.street.length >= 5],
    ].forEach(([id, ok]) => $(id).setAttribute("aria-invalid", String(!ok)));
  }
  return errors.length ? null : data;
}
function renderCheckout(focus = true) {
  document
    .querySelectorAll("[data-checkout-stage]")
    .forEach(
      (el) => (el.hidden = Number(el.dataset.checkoutStage) !== checkoutStep),
    );
  document.querySelectorAll("[data-checkout]").forEach((el) => {
    const n = Number(el.dataset.checkout);
    el.disabled = n > checkoutReached;
    el.className =
      n === checkoutStep ? "isCurrent" : n < checkoutStep ? "isComplete" : "";
    if (n === checkoutStep) el.setAttribute("aria-current", "step");
    else el.removeAttribute("aria-current");
  });
  $("checkoutHeading").textContent = [
    "Món trong giỏ",
    "Thông tin nhận hàng",
    "Kiểm tra trước khi thanh toán",
  ][checkoutStep];
  $("checkoutBack").hidden = checkoutStep === 0;
  $("checkoutNext").textContent = [
    "Thông tin nhận hàng →",
    "Kiểm tra tổng tiền →",
    "Thanh toán " + money(sums().total),
  ][checkoutStep];
  $("checkoutNext").disabled =
    selected().length === 0 ||
    (checkoutStep === 2 && !$("checkoutConsent").checked) ||
    (attempt && ["pending", "unknown"].includes(attempt.state));
  if (focus) $("checkoutHeading").focus();
}
function moveCheckout(target) {
  if (target > checkoutStep && selected().length === 0) return;
  if (target === 2) {
    const r = recipient();
    if (!r) {
      $("recipientForm").querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    $("recipientSummary").textContent =
      r.name +
      " · " +
      r.phone +
      "\n" +
      r.street +
      ", " +
      r.ward +
      ", " +
      $("province").selectedOptions[0].text +
      ", Việt Nam" +
      (r.note ? "\nGhi chú: " + r.note : "");
    allocation($("reviewLines"), selected());
  }
  checkoutStep = target;
  checkoutReached = Math.max(checkoutReached, target);
  renderCheckout();
}
document
  .querySelectorAll("[data-checkout]")
  .forEach((b) =>
    b.addEventListener("click", () => moveCheckout(Number(b.dataset.checkout))),
  );
document
  .querySelectorAll("[data-checkout-back]")
  .forEach((b) =>
    b.addEventListener("click", () =>
      moveCheckout(Number(b.dataset.checkoutBack)),
    ),
  );
$("checkoutBack").addEventListener("click", () =>
  moveCheckout(checkoutStep - 1),
);
$("checkoutConsent").addEventListener("change", () => renderCheckout(false));
$("checkoutNext").addEventListener("click", () => {
  if (checkoutStep < 2) moveCheckout(checkoutStep + 1);
  else startCheckout();
});
function startCheckout() {
  if (
    !$("checkoutConsent").checked ||
    !recipient(false) ||
    !selected().length ||
    (attempt && ["pending", "unknown"].includes(attempt.state))
  )
    return;
  mode = "initial";
  attempt = {
    id: "GIỎ-MẪU-" + (serial + 1),
    state: "pending",
    total: sums().total,
    lines: structuredClone(selected()),
    recipient: structuredClone(recipient(false)),
  };
  $("paymentContext").textContent =
    attempt.id +
    " · Một khoản thanh toán cho " +
    attempt.lines.length +
    " dòng đã chọn";
  $("purpose").textContent = "Thanh toán toàn bộ số tiền ban đầu của giỏ";
  $("payamount").textContent = money(attempt.total);
  allocation($("paymentAllocation"), attempt.lines);
  $("paystatus").textContent =
    "Trạng thái mẫu: đang chờ xác minh. Chưa ghi nhận tiền.";
  $("showreceipt").disabled = true;
  $("nextstep").textContent =
    "Sau khi xác nhận tiền, món cần tìm mua vào hàng việc của nhân viên. Các món chưa chọn vẫn ở giỏ.";
  renderCheckout(false);
  show("payment", true);
}
document.querySelectorAll("[data-result]").forEach((b) =>
  b.addEventListener("click", () => {
    if (!attempt || attempt.state === "paid") {
      if (!attempt)
        $("paystatus").textContent =
          "Thêm món và hoàn tất checkout trước khi thử thanh toán mẫu.";
      return;
    }
    attempt.state = b.dataset.result;
    $("paystatus").textContent = {
      pending: "Trạng thái mẫu: đang xác minh. Chưa ghi nhận tiền.",
      unknown:
        "Trạng thái mẫu: chưa rõ kết quả. Tiếp tục kiểm tra lần đang chờ; không thanh toán lại.",
      paid: "Trạng thái mẫu: đã xác nhận tiền. Phiếu và email thật chưa được tạo trong bản thiết kế.",
    }[attempt.state];
    if (attempt.state === "paid") {
      if (mode === "initial") {
        // Remove only the accepted quantities; later additions stay in the cart.
        cart = cart.flatMap((x) => {
          const paid = attempt.lines.find((y) => y.id === x.id);
          if (!paid) return [x];
          return x.quantity > paid.quantity
            ? [{ ...x, quantity: x.quantity - paid.quantity }]
            : [];
        });
        renderCart();
        renderStaff();
      }
      $("showreceipt").disabled = false;
    }
    renderCheckout(false);
  }),
);
function renderStaff() {
  const rows = attempt?.lines.filter((x) => x.requiresSourcing) ?? [];
  $("staffLines").replaceChildren();
  if (!rows.length) {
    $("staffLines").append(
      node(
        "p",
        "Không có món cần tìm mua trong lượt checkout mẫu vừa xác nhận.",
        "muted",
      ),
    );
    return;
  }
  rows.forEach((x) => {
    const el = node("article", undefined, "staffItem");
    el.append(
      node("span", "Cần tìm mua · Đã trả đủ ban đầu", "tag tagblue"),
      node("h3", x.name),
      node("p", x.quantity + " chiếc · " + (x.variant || "Chưa ghi mẫu")),
      node("p", "Giá khách tìm hiểu: " + x.cents / 100 + " USD / món"),
      node("p", "Đã phân bổ ban đầu: " + money(priceLine(x).total)),
      node(
        "p",
        x.notes ? "Ghi chú: " + x.notes : "Chưa có ghi chú thêm.",
        "hint",
      ),
    );
    $("staffLines").append(el);
  });
}
$("showreceipt").addEventListener("click", () => {
  if (attempt?.state !== "paid") return;
  $("receiptpurpose").textContent =
    mode === "initial"
      ? "Mẫu giỏ · thanh toán toàn bộ ban đầu"
      : "Ví dụ độc lập · khoản thanh toán thêm";
  $("receiptamount").textContent = money(attempt.total);
  $("document").querySelector(".product small").textContent =
    attempt.id + " · Khách hàng minh họa";
  const table = $("document").querySelector("table"),
    body = table.querySelector("tbody");
  table.setAttribute("aria-label", "Món trong khoản thanh toán mẫu");
  body.replaceChildren();
  attempt.lines.forEach((x) => {
    const row = node("tr");
    row.append(
      node(
        "td",
        x.name + " · " + (x.requiresSourcing ? "Cần tìm mua" : "Giá niêm yết"),
      ),
      node("td", x.variant || "Không ghi mẫu"),
      node("td", String(x.quantity)),
    );
    body.append(row);
  });
  if (!attempt.lines.length) {
    const row = node("tr");
    row.append(
      node("td", "Chênh lệch giá, phí mua hộ và cước theo bản demo-02"),
      node("td", "Khoản bổ sung"),
      node("td", "—"),
    );
    body.append(row);
  }
  const totals = $("document").querySelector(".statementTotals");
  totals.replaceChildren();
  const parts = attempt.lines.reduce(
    (s, x) => {
      const p = priceLine(x);
      s.listed += x.kind === "catalog" ? p.total : 0;
      s.goods += x.kind === "custom" ? p.goods : 0;
      s.fee += p.fee;
      return s;
    },
    { listed: 0, goods: 0, fee: 0 },
  );
  const rows =
    mode === "initial"
      ? [
          ["Giá niêm yết trọn gói", money(parts.listed)],
          ["Giá hàng cần tìm mua", money(parts.goods)],
          ["Phí mua hộ mẫu", money(parts.fee)],
          [
            "Cước món cần tìm mua",
            attempt.lines.some((x) => x.kind === "custom")
              ? "Chưa chốt"
              : "Không áp dụng",
          ],
        ]
      : [["Khoản trả thêm đã duyệt mẫu", money(attempt.total)]];
  rows.push(["Tiền nhận trong lần này", money(attempt.total)]);
  rows.forEach(([k, v]) => totals.append(node("dt", k), node("dd", v)));
  $("checkoutReceipt").hidden = false;
  $("checkoutReceiptTotal").textContent = money(attempt.total);
  allocation($("checkoutReceiptLines"), attempt.lines);
  show("document", true);
});
$("additionalconsent").addEventListener("change", () => {
  $("payadditional").disabled =
    additionalHeld || !$("additionalconsent").checked;
});
$("reviewcost").addEventListener("click", () => {
  additionalHeld = true;
  $("costreview").hidden = false;
  $("additionalconsent").checked = false;
  $("additionalconsent").disabled = true;
  $("reviewcost").disabled = true;
  $("payadditional").disabled = true;
});
$("payadditional").addEventListener("click", () => {
  if (additionalHeld || !$("additionalconsent").checked) return;
  if (attempt && ["pending", "unknown"].includes(attempt.state)) {
    $("costreview").hidden = false;
    $("costreview").textContent =
      "Lượt checkout mẫu trước chưa rõ kết quả. Kiểm tra lượt đó trước khi thử khoản khác.";
    return;
  }
  mode = "additional";
  attempt = { state: "pending", total: 450000, lines: [], id: "TRẢ-THÊM-MẪU" };
  $("paymentContext").textContent =
    "Ví dụ độc lập · đơn mua hộ mẫu, bản chi phí demo-02";
  $("purpose").textContent = "Thanh toán thêm sau khi duyệt chênh lệch";
  $("payamount").textContent = money(450000);
  $("paymentAllocation").replaceChildren();
  $("showreceipt").disabled = true;
  $("paystatus").textContent = "Chờ xác minh khoản trả thêm mẫu.";
  show("payment", true);
});
update();
updateCatalog();
renderCart();
renderCheckout(false);
