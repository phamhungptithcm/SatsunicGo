import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../shared/firebase";
import {
  catalogProductSchema,
  catalogSelectionSchema,
} from "../../../packages/domain/catalog-checkout";
import { quoteSchema, quoteTotal } from "../../../packages/domain";
import {
  createActionPreview,
  createPreviewAdmission,
  isPreviewAction,
  previewCurrent,
  previewJson,
  type ActionPreview,
  type PreviewCommand,
  type PreviewScope,
  type PreviewDetail,
} from "../../../packages/domain/action-preview";
import { conversationActionSchema } from "../../../packages/domain/ask-workflow";
import type { Commerce, CommerceMutation } from "./Commerce";

export function useActionPreview(options: {
  commerce: Commerce;
  history: boolean;
  accountPending: boolean;
  onReview: () => void;
}) {
  const current = useRef(options);
  current.current = options;
  const [preview, setPreview] = useState<ActionPreview | null>(null);
  const previewRef = useRef<ActionPreview | null>(null);
  const [status, setStatus] = useState<
    "editing" | "reviewing" | "executing" | "unknown" | "confirmed"
  >("editing");
  const [notice, setNotice] = useState<"unavailable" | "stale" | null>(null);
  const rendered = useRef<string | null>(null),
    sequence = useRef(0),
    revision = useRef(0);
  const running = useRef(false),
    admission = useRef(createPreviewAdmission());
  function scope(): PreviewScope | null {
    const value = current.current.commerce.commandScope();
    return value
      ? {
          ...value,
          localRevision: revision.current,
          history: current.current.history,
        }
      : null;
  }
  function invalidate() {
    ++sequence.current;
    ++revision.current;
    rendered.current = null;
    previewRef.current = null;
    setPreview(null);
    if (!running.current) setStatus("editing");
  }
  function hideReview() {
    rendered.current = null;
  }
  function markRendered(id: string) {
    if (previewRef.current?.id === id && !current.current.history)
      rendered.current = id;
  }
  function canonical(input: CommerceMutation): PreviewCommand | null {
    if (!isPreviewAction(input.action)) return null;
    if (
      input.expectedOrderVersion !== undefined &&
      (!Number.isSafeInteger(input.expectedOrderVersion) ||
        input.expectedOrderVersion < 0)
    )
      return null;
    const parsed = conversationActionSchema.safeParse({
      action: input.action,
      payload: input.payload,
    });
    if (!parsed.success || !isPreviewAction(parsed.data.action)) return null;
    return {
      action: parsed.data.action,
      payload: parsed.data.payload,
      ...(input.expectedOrderVersion === undefined
        ? {}
        : { expectedOrderVersion: input.expectedOrderVersion }),
    };
  }
  async function prepare(input: CommerceMutation) {
    const c = current.current.commerce;
    const command = canonical(input);
    if (
      !command ||
      running.current ||
      c.busy ||
      c.pendingOperation ||
      current.current.history ||
      current.current.accountPending
    )
      return false;
    const ticket = ++sequence.current;
    rendered.current = null;
    previewRef.current = null;
    setPreview(null);
    const coherent = await c.reviewBarrier();
    if (
      ticket !== sequence.current ||
      !coherent ||
      c.readinessIssue(command.action)
    ) {
      if (ticket === sequence.current) setNotice("unavailable");
      return false;
    }
    const captured = scope();
    if (
      !captured ||
      captured.history ||
      (command.expectedOrderVersion !== undefined &&
        command.expectedOrderVersion !== captured.orderVersion)
    )
      return false;
    const expiresAt =
      command.action === "acceptQuote" ? c.order?.quote?.expiresAt : undefined;
    let next: ActionPreview;
    try {
      const details: PreviewDetail[] = [];
      if (command.action === "catalogCheckout") {
        if (!db) throw Error("UNAVAILABLE_PRODUCT");
        const selection = catalogSelectionSchema.parse(command.payload);
        const snap = await getDoc(doc(db, "products", selection.productId));
        const product = catalogProductSchema.parse(snap.data());
        if (
          snap.metadata.fromCache ||
          product.version !== selection.productVersion ||
          (product.catalogOptions.length
            ? !product.catalogOptions.includes(selection.variant)
            : selection.variant !== "")
        )
          throw Error("STALE_PRODUCT");
        const total = product.listedPrice * selection.quantity;
        if (!Number.isSafeInteger(total) || total > 1e12)
          throw Error("INVALID_TOTAL");
        details.push(
          { vi: "Sản phẩm", en: "Product", value: product.title },
          { vi: "Mẫu", en: "Variant", value: selection.variant || "—" },
          { vi: "Số lượng", en: "Quantity", value: selection.quantity },
          {
            vi: "Đơn giá trọn gói",
            en: "All-inclusive unit price",
            value: product.listedPrice,
            kind: "money",
          },
          { vi: "Tổng thanh toán", en: "Total", value: total, kind: "money" },
          { vi: "Điều khoản", en: "Terms", value: product.termsVersion },
          {
            vi: "Phiên bản sản phẩm",
            en: "Product version",
            value: product.version,
            secondary: true,
          },
        );
      } else if (command.action !== "submitRequest") {
        const order = current.current.commerce.order;
        if (
          !order ||
          order.id !== captured.orderId ||
          order.version !== captured.orderVersion ||
          order.ownerId !== captured.ownerId
        )
          throw Error("STALE_ORDER");
        details.push({ vi: "Đơn hàng", en: "Order", value: order.id });
        if (command.action === "acceptQuote") {
          const quote = quoteSchema.parse(order.quote);
          if (
            (command.payload as { quoteVersion: number }).quoteVersion !==
              order.quoteVersion ||
            !Number.isSafeInteger(order.deposit) ||
            order.deposit! < 0 ||
            order.deposit! > 1e12 ||
            !Number.isFinite(new Date(quote.expiresAt).getTime())
          )
            throw Error("STALE_QUOTE");
          details.push(
            {
              vi: "Tổng báo giá",
              en: "Quoted total",
              value: quoteTotal(quote),
              kind: "money",
            },
            {
              vi: "Tiền cọc",
              en: "Deposit",
              value: order.deposit!,
              kind: "money",
            },
            {
              vi: "Sản phẩm đã kiểm tra",
              en: "Verified product",
              value: quote.verifiedProduct,
            },
            { vi: "Điều khoản", en: "Terms", value: quote.termsVersion },
            {
              vi: "Phiên bản báo giá",
              en: "Quote version",
              value: order.quoteVersion!,
              secondary: true,
            },
            {
              vi: "Báo giá hết hạn",
              en: "Quote expires",
              value: quote.expiresAt,
              kind: "time",
            },
          );
        } else if (command.action === "approveFinal") {
          if (
            !Number.isSafeInteger(order.finalTotal) ||
            order.finalTotal! < 0 ||
            order.finalTotal! > 1e12
          )
            throw Error("INVALID_TOTAL");
          details.push({
            vi: "Tổng tiền cuối",
            en: "Final total",
            value: order.finalTotal!,
            kind: "money",
          });
        } else {
          details.push({
            vi: "Toàn bộ sản phẩm",
            en: "All items",
            value: order.items
              .map(
                (item) => `${item.name} · ${item.variant} · ${item.quantity}`,
              )
              .join("; "),
          });
        }
        details.push({
          vi: "Phiên bản đơn",
          en: "Order version",
          value: order.version,
          secondary: true,
        });
      }
      next = await createActionPreview(
        command,
        captured,
        Date.now(),
        expiresAt,
        details,
      );
    } catch {
      if (ticket === sequence.current) {
        setNotice("unavailable");
        setStatus("editing");
      }
      return false;
    }
    if (
      ticket !== sequence.current ||
      !previewCurrent(next, scope()) ||
      current.current.history ||
      current.current.accountPending ||
      current.current.commerce.pendingOperation
    )
      return false;
    previewRef.current = next;
    setPreview(next);
    setStatus("reviewing");
    setNotice(null);
    current.current.onReview();
    return true;
  }
  async function confirm(
    command?: PreviewCommand,
  ): Promise<"confirmed" | "review" | "blocked"> {
    const value = previewRef.current,
      c = current.current.commerce;
    if (
      running.current ||
      current.current.history ||
      current.current.accountPending ||
      c.busy ||
      c.pendingOperation
    )
      return "blocked";
    if (
      !value ||
      !previewCurrent(value, scope()) ||
      (command && previewJson(command) !== value.commandJson)
    ) {
      invalidate();
      setNotice("stale");
      return command && (await prepare(command)) ? "review" : "blocked";
    }
    if (rendered.current !== value.id) {
      current.current.onReview();
      return "review";
    }
    running.current = true;
    setStatus("executing");
    const identity = c.commandIdentity();
    try {
      const verified = await c.run(
        value.command,
        () =>
          !current.current.history &&
          !current.current.accountPending &&
          !current.current.commerce.readinessIssue(value.command.action) &&
          admission.current.consume(
            value,
            scope(),
            value.command,
            rendered.current,
          ),
      );
      const after = current.current.commerce.commandIdentity();
      if (!identity || !after || previewJson(identity) !== previewJson(after)) {
        setStatus("editing");
        return "blocked";
      }
      // Locale/history invalidate consent, but do not discard an owned verified outcome.
      rendered.current = null;
      if (verified || !current.current.commerce.pendingOperation) {
        previewRef.current = null;
        setPreview(null);
      }
      setStatus(
        verified
          ? "confirmed"
          : current.current.commerce.pendingOperation
            ? "unknown"
            : "editing",
      );
      if (!verified) setNotice("unavailable");
      return verified ? "confirmed" : "blocked";
    } finally {
      running.current = false;
    }
  }
  async function request(input: CommerceMutation, approve = false) {
    const command = canonical(input);
    if (!command) return "blocked" as const;
    if (approve && previewRef.current) return confirm(command);
    return (await prepare(command))
      ? ("review" as const)
      : ("blocked" as const);
  }
  // Binding checks use synchronous Commerce refs at admission. Effects only update the view.
  const currentScope = scope();
  const stamp = currentScope ? previewJson(currentScope) : "unavailable";
  useEffect(() => {
    const value = previewRef.current;
    if (value && !running.current && !previewCurrent(value, scope()))
      invalidate();
  }, [stamp]);
  useEffect(() => {
    if (!preview) return;
    const timer = setTimeout(
      () => {
        if (previewRef.current === preview && !running.current) {
          invalidate();
          setNotice("stale");
        }
      },
      Math.max(0, preview.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [preview]);
  useEffect(
    () => () => {
      ++sequence.current;
      rendered.current = null;
      previewRef.current = null;
    },
    [],
  );
  const commerce: Commerce = {
    ...options.commerce,
    setDraft(next) {
      if (current.current.history || current.current.accountPending) return;
      invalidate();
      current.current.commerce.setDraft(next);
    },
    async resolved(question, answer) {
      if (current.current.history) return;
      const identity = current.current.commerce.commandIdentity();
      invalidate();
      await current.current.commerce.resolved(question, answer);
      const after = current.current.commerce.commandIdentity();
      if (
        (answer.shoppingDraft || answer.draft) &&
        identity &&
        after &&
        previewJson(identity) === previewJson(after) &&
        !current.current.accountPending
      )
        current.current.onReview();
    },
    async run(input, admit) {
      if (current.current.history || current.current.accountPending)
        return false;
      if (isPreviewAction(input.action)) {
        await request(input);
        return false;
      }
      invalidate();
      const admittedRevision = revision.current;
      return current.current.commerce.run(
        input,
        () =>
          !current.current.history &&
          !current.current.accountPending &&
          revision.current === admittedRevision &&
          (!admit || admit()),
      );
    },
    async resume() {
      if (current.current.history || current.current.accountPending) return;
      const captured = scope();
      const result = await current.current.commerce.resume();
      const after = scope();
      if (
        !result ||
        !captured ||
        !after ||
        captured.ownerId !== after.ownerId ||
        captured.conversationId !== after.conversationId ||
        captured.epoch !== after.epoch
      )
        return;
      invalidate();
      setStatus(result === "recorded" ? "confirmed" : "editing");
      setNotice(null);
      return result;
    },
    async newConversation() {
      if (
        !current.current.history &&
        !current.current.accountPending &&
        !current.current.commerce.pendingOperation
      ) {
        invalidate();
        await current.current.commerce.newConversation();
      }
    },
  };
  return {
    commerce,
    preview,
    status,
    notice,
    request,
    confirm,
    invalidate,
    hideReview,
    markRendered,
  };
}
