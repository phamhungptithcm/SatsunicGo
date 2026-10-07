import {
  Children,
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import "./step-form.css";

type ReviewRow = { label: string; value: string };
const StageContext = createContext({
  step: -1,
  last: 0,
  labels: [] as readonly string[],
  summary: [] as ReviewRow[],
});
export function StepStage({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const { step, last, labels, summary } = useContext(StageContext);
  return (
    <section
      className="crmStepStage"
      data-step-stage={index}
      hidden={step >= 0 && step !== index}
    >
      {labels[index] && (
        <h3 className="crmStepTitle" tabIndex={-1}>
          {labels[index]}
        </h3>
      )}
      {index === last && summary.length > 0 && (
        <dl className="crmStepReview" aria-label="Thông tin trước khi gửi">
          {summary.map((row, i) => (
            <div key={i}>
              <dt>{row.label}</dt>
              <dd>
                {row.value.length > 300 ? (
                  <>
                    <span>{row.value.slice(0, 300)}…</span>
                    <details>
                      <summary>Xem toàn bộ</summary>
                      {row.value}
                    </details>
                  </>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </section>
  );
}
type Props = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  ref?: Ref<HTMLFormElement>;
  steps: readonly string[];
  disabled?: boolean;
  navigationBlocked?: boolean;
  resetKey?: string;
  enabled?: boolean;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  validateStep?: (step: number, form: HTMLFormElement) => string | null;
  review?: (data: FormData) => ReactNode;
  finalAction?: ReactNode;
  header?: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

/** One native form: stages hide presentation, never remove fields from the command. */
export function StepForm({
  ref,
  steps,
  children,
  disabled = false,
  navigationBlocked = false,
  resetKey,
  enabled = true,
  activeStep,
  onStepChange,
  validateStep,
  review,
  finalAction,
  header,
  onSubmit,
  onChange,
  className = "",
  ...attributes
}: Props) {
  const form = useRef<HTMLFormElement>(null);
  useImperativeHandle(ref, () => form.current!);
  const [internalStep, setInternalStep] = useState(0);
  const step = activeStep ?? internalStep;
  const last = steps.length - 1;
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ReviewRow[]>([]);
  const [reviewData, setReviewData] = useState<FormData | null>(null);
  const changeStep = (next: number) => {
    setInternalStep(next);
    onStepChange?.(next);
  };
  useEffect(() => {
    const node = form.current;
    const reset = () => {
      setInternalStep(0);
      onStepChange?.(0);
      setError("");
      setSummary([]);
      setReviewData(null);
    };
    reset();
    node?.addEventListener("reset", reset);
    return () => node?.removeEventListener("reset", reset);
    // Reset follows the existing form identity or acknowledged native reset.
  }, [resetKey]);
  function blocked() {
    return (
      disabled ||
      navigationBlocked ||
      !!form.current?.querySelector("fieldset:disabled")
    );
  }
  function refreshReview() {
    if (form.current) {
      setReviewData(new FormData(form.current));
      const rows: ReviewRow[] = [];
      form.current
        .querySelectorAll<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >("input,select,textarea")
        .forEach((control) => {
          if (
            control.type === "hidden" ||
            control.type === "password" ||
            control.type === "file" ||
            control.matches(":disabled")
          )
            return;
          const label = control.labels?.[0];
          if (!label) return;
          const copy = label.cloneNode(true) as HTMLElement;
          copy
            .querySelectorAll("input,select,textarea,small")
            .forEach((element) => element.remove());
          const text = copy.textContent?.replace(/\s+/g, " ").trim();
          if (!text) return;
          const value =
            control instanceof HTMLSelectElement
              ? (control.selectedOptions[0]?.text ?? "")
              : control instanceof HTMLInputElement &&
                  ["checkbox", "radio"].includes(control.type)
                ? control.checked
                  ? "Đã chọn"
                  : "Chưa chọn"
                : control.type === "number" && control.value
                  ? Number(control.value).toLocaleString("vi-VN", {
                      maximumFractionDigits: 20,
                    })
                  : control.value;
          if (
            control.type === "radio" &&
            !(control as HTMLInputElement).checked
          )
            return;
          rows.push({ label: text, value: value || "Chưa nhập" });
        });
      setSummary(rows);
    }
  }
  function move(next: number, invalid?: HTMLElement) {
    if (next === last) refreshReview();
    changeStep(next);
    requestAnimationFrame(() => {
      if (invalid) {
        let ancestor = invalid.parentElement;
        while (ancestor && ancestor !== form.current) {
          if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
          ancestor = ancestor.parentElement;
        }
        invalid.focus();
        if ("reportValidity" in invalid)
          (invalid as HTMLInputElement).reportValidity();
      } else {
        const stage = form.current?.querySelector<HTMLElement>(
          `[data-step-stage="${next}"]`,
        );
        const heading = stage?.querySelector<HTMLElement>("h3") ?? stage;
        if (heading) {
          heading.tabIndex = -1;
          heading.focus();
        }
      }
    });
  }
  function validate(index: number) {
    const node = form.current;
    if (!node) return false;
    const controls = node.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      `[data-step-stage="${index}"] input,[data-step-stage="${index}"] select,[data-step-stage="${index}"] textarea`,
    );
    const invalid = Array.from(controls).find(
      (control) => control.willValidate && !control.validity.valid,
    );
    if (invalid) {
      setError("Kiểm tra thông tin của bước này.");
      move(index, invalid);
      return false;
    }
    const message = validateStep?.(index, node);
    if (message) {
      setError(message);
      move(index);
      return false;
    }
    return true;
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    // Retry buttons outside the disabled editor keep the original uncertain-operation path.
    if (
      submitter instanceof HTMLButtonElement &&
      !submitter.closest("[data-step-stage]") &&
      !submitter.hasAttribute("data-step-next")
    ) {
      onSubmit(event);
      return;
    }
    event.preventDefault();
    if (blocked()) return;
    setError("");
    if (step < last) {
      if (validate(step)) move(step + 1);
      return;
    }
    if (!(submitter instanceof HTMLButtonElement && submitter.formNoValidate))
      for (let index = 0; index <= last; index++) if (!validate(index)) return;
    onSubmit(event);
  }
  if (!enabled)
    return (
      <form
        {...attributes}
        ref={form}
        className={className}
        onSubmit={onSubmit}
        onChange={onChange}
      >
        {children}
      </form>
    );
  const panels = finalAction ? Children.toArray(children) : null;
  return (
    <StageContext.Provider value={{ step, last, labels: steps, summary }}>
      <form
        {...attributes}
        ref={form}
        className={`${className} crmStepForm`}
        data-crm-steps=""
        noValidate
        onSubmit={submit}
        onChange={(event) => {
          setError("");
          onChange?.(event);
          if (step === last) refreshReview();
        }}
      >
        {header && <div className="crmStepHeader">{header}</div>}
        <nav
          className="crmStepper"
          aria-label="Các bước nhập thông tin"
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          }}
        >
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-current={step === index ? "step" : undefined}
              className={
                index < step ? "isComplete" : index === step ? "isCurrent" : ""
              }
              disabled={disabled || navigationBlocked || index > step}
              onClick={() => {
                if (!blocked()) {
                  setError("");
                  move(index);
                }
              }}
            >
              <span aria-hidden="true">{index < step ? "✓" : index + 1}</span>
              <span>
                {label}
                <small>
                  {index < step
                    ? "Đã kiểm tra"
                    : index === step
                      ? "Đang nhập"
                      : ""}
                </small>
              </span>
            </button>
          ))}
        </nav>
        <div className="crmStepContent">
          {panels ? (
            <fieldset disabled={disabled} className="form crmStepBody">
              {panels.map((panel, index) => (
                <section
                  key={steps[index]}
                  data-step-stage={index}
                  hidden={step !== index}
                >
                  {index === last && reviewData && review && (
                    <div className="crmStepReview">{review(reviewData)}</div>
                  )}
                  {panel}
                </section>
              ))}
              {step === last && <div data-step-stage={last}>{finalAction}</div>}
            </fieldset>
          ) : (
            children
          )}
          {error && (
            <p role="alert" className="error crmStepError">
              {error}
            </p>
          )}
          <div className="crmStepActions">
            {step > 0 && (
              <button
                type="button"
                disabled={disabled || navigationBlocked}
                onClick={() => {
                  if (!blocked()) {
                    setError("");
                    move(step - 1);
                  }
                }}
              >
                ← Quay lại
              </button>
            )}
            {step < last && (
              <button
                type="submit"
                data-step-next
                className="primary"
                disabled={disabled || navigationBlocked}
              >
                Tiếp tục →
              </button>
            )}
          </div>
        </div>
      </form>
    </StageContext.Provider>
  );
}
