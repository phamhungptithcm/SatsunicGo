import { useId, useState, useEffect, type FormEvent } from "react";
import {
  shipmentDeliveryEstimate,
  type OrderDeliveryEstimate,
} from "../../../packages/domain/order-tracking";
import {
  readManualDeliveryEstimate,
  type Parcel,
} from "../../../packages/domain/shipping";
import {
  deviceTimeZone,
  localInstants,
  offsetLabel,
  formatEstimateInstant,
  EstimateInputError,
  estimateWindow,
} from "./delivery-estimate-time";
export function DeliveryEstimate({
  value,
  state,
  observedAt,
  language = "vi",
  aggregate = false,
  compact = false,
}: {
  value: unknown;
  state?: Parcel["state"];
  observedAt: number;
  language?: "vi" | "en";
  aggregate?: boolean;
  compact?: boolean;
}) {
  const vi = language === "vi",
    zone = deviceTimeZone();
  const whole = value as Partial<OrderDeliveryEstimate> | null;
  const window =
    aggregate &&
    whole?.source === "staff_aggregate" &&
    Object.keys(whole).every((key) =>
      [
        "source",
        "startAt",
        "endAt",
        "oldestRecordedAt",
        "latestRecordedAt",
      ].includes(key),
    ) &&
    Number.isSafeInteger(whole.oldestRecordedAt) &&
    Number(whole.oldestRecordedAt) > 0 &&
    Number(whole.oldestRecordedAt) <= Number(whole.latestRecordedAt)
      ? readManualDeliveryEstimate(
          {
            source: "staff",
            startAt: whole.startAt,
            endAt: whole.endAt,
            recordedAt: whole.latestRecordedAt,
          },
          observedAt,
        )
      : null;
  let parcelValue = value;
  if (value && typeof value === "object" && "freshness" in value) {
    const dto = value as Record<string, unknown>;
    const allowed = ["source", "startAt", "endAt", "recordedAt", "freshness"];
    parcelValue =
      Object.keys(dto).every((key) => allowed.includes(key)) &&
      ["current", "expired", "needs_update"].includes(String(dto.freshness))
        ? {
            source: dto.source,
            startAt: dto.startAt,
            endAt: dto.endAt,
            recordedAt: dto.recordedAt,
          }
        : null;
  }
  const parcel = state
    ? shipmentDeliveryEstimate(parcelValue, state, observedAt)
    : null;
  const current = aggregate
    ? window && window.endAt >= observedAt
      ? window
      : null
    : parcel;
  if (!current)
    return (
      <p className="quietNote">
        {vi
          ? aggregate
            ? "Chưa có thời gian giao dự kiến được xác nhận."
            : "Chưa có thời gian giao dự kiến."
          : aggregate
            ? "No confirmed delivery estimate is available."
            : "No delivery estimate is available."}
      </p>
    );
  if (compact && aggregate) {
    const day = new Intl.DateTimeFormat(vi ? "vi-VN" : "en-GB", {
      day: "numeric",
      month: "short",
      timeZone: zone,
    });
    const year = new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: zone,
    });
    const month = new Intl.DateTimeFormat("en", {
      month: "numeric",
      year: "numeric",
      timeZone: zone,
    });
    const firstDay =
      month.format(current.startAt) === month.format(current.endAt)
        ? new Intl.DateTimeFormat("en", {
            day: "numeric",
            timeZone: zone,
          }).format(current.startAt)
        : day.format(current.startAt);
    return (
      <div className="deliveryEstimateCompact">
        <span>{vi ? "Dự kiến nhận hàng" : "Estimated delivery"}</span>
        <p className="deliveryEstimateRange">
          <time dateTime={new Date(current.startAt).toISOString()}>
            {firstDay}
          </time>
          {" – "}
          <time dateTime={new Date(current.endAt).toISOString()}>
            {day.format(current.endAt)}
          </time>
        </p>
        <span>
          {year.format(current.startAt)}
          {year.format(current.endAt) !== year.format(current.startAt)
            ? " – " + year.format(current.endAt)
            : ""}
        </span>
        <p className="quietNote">
          {vi
            ? "Ước tính của nhân viên, có thể thay đổi."
            : "Staff estimate; dates may change."}
        </p>
        <details>
          <summary>{vi ? "Chi tiết thời gian" : "Time details"}</summary>
          <DeliveryEstimate
            aggregate
            value={value}
            observedAt={observedAt}
            language={language}
          />
        </details>
      </div>
    );
  }
  return (
    <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
      <p>
        <strong>
          {parcel && parcel.freshness !== "current"
            ? vi
              ? "Ước tính trước đó"
              : "Previous estimate"
            : vi
              ? "Dự kiến giao"
              : "Estimated delivery"}
        </strong>{" "}
        <time dateTime={new Date(current.startAt).toISOString()}>
          {formatEstimateInstant(current.startAt, language, zone)}
        </time>
        {" – "}
        <time dateTime={new Date(current.endAt).toISOString()}>
          {formatEstimateInstant(current.endAt, language, zone)}
        </time>
      </p>
      <p className="quietNote">
        {vi
          ? "Ước tính của nhân viên, có thể thay đổi."
          : "Staff estimate; dates may change."}
        <br />
        {vi ? "Ghi nhận: " : "Recorded: "}
        <time dateTime={new Date(current.recordedAt).toISOString()}>
          {formatEstimateInstant(current.recordedAt, language, zone)}
        </time>
        {aggregate && whole?.oldestRecordedAt !== whole?.latestRecordedAt && (
          <>
            <br />
            {vi ? "Ước tính cũ nhất: " : "Oldest estimate: "}
            <time
              dateTime={new Date(Number(whole?.oldestRecordedAt)).toISOString()}
            >
              {formatEstimateInstant(
                Number(whole?.oldestRecordedAt),
                language,
                zone,
              )}
            </time>
          </>
        )}
      </p>
      {parcel?.freshness === "expired" && (
        <p role="status">
          {vi
            ? "Đã qua khoảng dự kiến. Cần cập nhật lại."
            : "The estimated window has passed. An update is needed."}
        </p>
      )}
      {parcel?.freshness === "needs_update" && (
        <p role="status">
          {vi
            ? "Giao chưa thành công. Khoảng dự kiến cần được cập nhật."
            : "Delivery was unsuccessful. The estimate needs an update."}
        </p>
      )}
    </div>
  );
}
export type EstimateDraft = {
  start: string;
  end: string;
  startChoice: string;
  endChoice: string;
  zone: string;
  evidence: string;
};
export const estimateInputCopy = {
  date: "Thời gian này không hợp lệ hoặc không tồn tại trong múi giờ đã chọn.",
  missing: "Nhập đủ thời gian bắt đầu và kết thúc.",
  ambiguous: "Giờ này xuất hiện hai lần. Chọn độ lệch UTC cho từng thời gian.",
  zone: "Múi giờ thiết bị đã thay đổi. Khởi tạo lại thời gian trước khi lưu.",
  range: "Thời gian kết thúc phải bằng hoặc sau thời gian bắt đầu.",
  elapsed: "Khoảng dự kiến đã qua. Chọn thời gian kết thúc mới.",
};
export function estimatePayload(form: HTMLFormElement, remove = false) {
  const data = new FormData(form),
    evidence = String(data.get("evidence") ?? "").trim();
  if (evidence.length < 5 || evidence.length > 1000) throw Error("EVIDENCE");
  return {
    estimate: remove
      ? null
      : estimateWindow(
          {
            start: String(data.get("start") ?? ""),
            end: String(data.get("end") ?? ""),
            startChoice: String(data.get("startChoice") ?? ""),
            endChoice: String(data.get("endChoice") ?? ""),
            zone: String(data.get("zone") ?? ""),
          },
          deviceTimeZone(),
          Date.now(),
        ),
    evidence,
  };
}
export function DeliveryEstimateForm({
  parcel,
  disabled,
  drafts,
  capture,
  onSubmit,
}: {
  parcel: Parcel;
  disabled: boolean;
  drafts: Map<string, EstimateDraft>;
  capture: (form: HTMLFormElement) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<EstimateDraft>(
    () =>
      drafts.get(parcel.id) ?? {
        start: "",
        end: "",
        startChoice: "",
        endChoice: "",
        zone: deviceTimeZone(),
        evidence: "",
      },
  );
  const [error, setError] = useState("");
  const [problem, setProblem] = useState<
    EstimateInputError["reason"] | "evidence" | null
  >(null);
  useEffect(() => {
    if (!drafts.has(parcel.id))
      setDraft({
        start: "",
        end: "",
        startChoice: "",
        endChoice: "",
        zone: deviceTimeZone(),
        evidence: "",
      });
  }, [parcel.id, parcel.version, drafts]);
  function update(next: EstimateDraft, form?: HTMLFormElement | null) {
    // Keep the existing imperative intent snapshot in sync with controlled values before remounts.
    if (form) {
      for (const [name, value] of Object.entries(next)) {
        const control = form.elements.namedItem(name);
        if (
          control instanceof HTMLInputElement ||
          control instanceof HTMLSelectElement ||
          control instanceof HTMLTextAreaElement
        )
          control.value = value;
      }
      capture(form);
    }
    drafts.set(parcel.id, next);
    setDraft(next);
    setError("");
    setProblem(null);
  }
  function dateInput(name: "start" | "end", label: string) {
    const choices = localInstants(draft[name], draft.zone),
      choiceName = name === "start" ? "startChoice" : "endChoice";
    return (
      <label style={{ minWidth: 0 }}>
        {label}
        <input
          style={{ minWidth: 0, maxWidth: "100%" }}
          type="datetime-local"
          name={name}
          value={draft[name]}
          onChange={(event) =>
            update(
              { ...draft, [name]: event.target.value, [choiceName]: "" },
              event.currentTarget.form,
            )
          }
          aria-describedby={`${id}-zone ${id}-error`}
          aria-invalid={problem && problem !== "evidence" ? true : undefined}
        />
        {choices.length > 1 ? (
          <select
            aria-label={`${label}: độ lệch UTC`}
            name={choiceName}
            value={draft[choiceName]}
            onChange={(event) =>
              update({ ...draft, [choiceName]: event.target.value })
            }
          >
            <option value="">Chọn độ lệch UTC</option>
            {choices.map((c) => (
              <option key={c.at} value={String(c.at)}>
                {offsetLabel(c.offsetMinutes)}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input type="hidden" name={choiceName} value="" />
            {choices.length === 1 && (
              <small>{offsetLabel(choices[0].offsetMinutes)}</small>
            )}
          </>
        )}
      </label>
    );
  }
  return (
    <details className="crmItemDetails" name="crm-shipping-actions">
      <summary>Thời gian giao dự kiến</summary>
      <form
        className="form"
        data-intent={`eta:${parcel.id}`}
        onChange={(event) => capture(event.currentTarget)}
        onSubmit={(event) => {
          event.preventDefault();
          const submitter = (event.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
          try {
            estimatePayload(event.currentTarget, submitter?.value === "remove");
            setError("");
            setProblem(null);
            onSubmit(event);
          } catch (cause) {
            setProblem(
              cause instanceof EstimateInputError ? cause.reason : "evidence",
            );
            setError(
              cause instanceof EstimateInputError
                ? estimateInputCopy[cause.reason]
                : "Ghi lý do cập nhật từ 5 đến 1.000 ký tự.",
            );
          }
        }}
      >
        <fieldset className="form" style={{ minWidth: 0 }} disabled={disabled}>
          <p
            id={`${id}-zone`}
            className="quietNote"
            style={{ overflowWrap: "anywhere" }}
          >
            Múi giờ: {draft.zone}
          </p>
          <input type="hidden" name="zone" value={draft.zone} />
          {dateInput("start", "Từ")}
          {dateInput("end", "Đến")}
          <label>
            Lý do cập nhật
            <textarea
              name="evidence"
              value={draft.evidence}
              maxLength={1000}
              onChange={(event) =>
                update({ ...draft, evidence: event.target.value })
              }
              aria-describedby={`${id}-error`}
              aria-invalid={problem === "evidence" ? true : undefined}
            />
          </label>
          <p
            id={`${id}-error`}
            hidden={!error}
            role={error ? "alert" : undefined}
            className="error"
          >
            {error}
          </p>
          <div className="crmActions">
            <button className="primary" name="etaIntent" value="save">
              Lưu thời gian dự kiến
            </button>
            {readManualDeliveryEstimate(
              parcel.deliveryEstimate,
              Date.now(),
            ) && (
              <button name="etaIntent" value="remove">
                Gỡ thời gian dự kiến
              </button>
            )}
          </div>
          {draft.zone !== deviceTimeZone() && (
            <button
              type="button"
              onClick={(event) =>
                update(
                  {
                    ...draft,
                    start: "",
                    end: "",
                    startChoice: "",
                    endChoice: "",
                    zone: deviceTimeZone(),
                  },
                  event.currentTarget.form,
                )
              }
            >
              Khởi tạo lại thời gian
            </button>
          )}
        </fieldset>
      </form>
    </details>
  );
}
