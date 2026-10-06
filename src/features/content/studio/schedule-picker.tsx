import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { StudioIcon } from "./ui";
import {
  localDay,
  localScheduleInstant,
  scheduleLabel,
  validScheduleTime,
} from "./schedule-time";

function allowedDay(day: string, today: string, lastDay: string) {
  return day >= today && day <= lastDay;
}

export function SchedulePicker({
  value,
  onChange,
  onValidityChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (valid: boolean) => void;
  disabled?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  const initial = value
    ? new Date(`${value.slice(0, 10)}T12:00`)
    : new Date(now);
  const [month, setMonth] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  const [focusDay, setFocusDay] = useState(() => localDay(initial));
  const [time, setTime] = useState(value.slice(11) || "09:00");
  const grid = useRef<HTMLDivElement>(null);
  const focusRequested = useRef(false);
  const helpId = useId(),
    timeId = useId();
  const today = localDay(new Date(now));
  const lastDay = localDay(new Date(now + 366 * 86400000));
  const selected = value.slice(0, 10);
  const instant = localScheduleInstant(value);
  const valid = instant !== null && validScheduleTime(instant, now);
  const activeDay =
    allowedDay(focusDay, today, lastDay) &&
    focusDay.slice(0, 7) === localDay(month).slice(0, 7)
      ? focusDay
      : today.slice(0, 7) === localDay(month).slice(0, 7)
        ? today
        : localDay(month);
  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useLayoutEffect(() => {
    if (focusRequested.current) {
      grid.current
        ?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)
        ?.focus();
      focusRequested.current = false;
    }
  }, [focusDay, month]);
  const allowed = (day: string) => day >= today && day <= lastDay;
  const first = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(month);
  const firstYear = Number(today.slice(0, 4)),
    lastYear = Number(lastDay.slice(0, 4));
  const monthBounds = (year: number) => ({
    min: year === firstYear ? Number(today.slice(5, 7)) - 1 : 0,
    max: year === lastYear ? Number(lastDay.slice(5, 7)) - 1 : 11,
  });
  const showMonth = (year: number, index: number) => {
    if (year < firstYear || year > lastYear) return;
    const bounds = monthBounds(year);
    const next = new Date(
      year,
      Math.max(bounds.min, Math.min(index, bounds.max)),
      1,
    );
    setMonth(next);
    setFocusDay(
      localDay(
        new Date(
          Math.max(next.getTime(), new Date(`${today}T00:00`).getTime()),
        ),
      ),
    );
  };
  const changeMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    showMonth(next.getFullYear(), next.getMonth());
  };
  return (
    <section className="schedule-picker" aria-label="Chọn ngày giờ xuất bản">
      <div className="schedule-month">
        <div className="schedule-month-selects">
          <div className="schedule-period-field">
            <select
              aria-label="Chọn tháng"
              value={month.getMonth()}
              disabled={disabled}
              onChange={(e) =>
                showMonth(month.getFullYear(), Number(e.target.value))
              }
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option
                  key={index}
                  value={index}
                  disabled={
                    index < monthBounds(month.getFullYear()).min ||
                    index > monthBounds(month.getFullYear()).max
                  }
                >
                  Tháng {index + 1}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </div>
          <div className="schedule-period-field">
            <select
              aria-label="Chọn năm"
              value={month.getFullYear()}
              disabled={disabled}
              onChange={(e) =>
                showMonth(Number(e.target.value), month.getMonth())
              }
            >
              {Array.from({ length: lastYear - firstYear + 1 }, (_, index) => (
                <option key={index} value={firstYear + index}>
                  {firstYear + index}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {monthLabel}
        </span>
        <div className="schedule-month-navigation">
          <button
            type="button"
            className="schedule-month-arrow"
            aria-label="Tháng trước"
            disabled={
              disabled || localDay(month).slice(0, 7) <= today.slice(0, 7)
            }
            onClick={() => changeMonth(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="schedule-month-arrow"
            aria-label="Tháng sau"
            disabled={
              disabled || localDay(month).slice(0, 7) >= lastDay.slice(0, 7)
            }
            onClick={() => changeMonth(1)}
          >
            ›
          </button>
        </div>
      </div>
      <p className="sr-only" id={helpId}>
        Dùng phím mũi tên để di chuyển ngày, Page Up hoặc Page Down để đổi
        tháng, Enter để chọn.
      </p>
      <div
        ref={grid}
        className="schedule-grid"
        role="grid"
        aria-label={monthLabel}
        aria-describedby={helpId}
      >
        <div role="row">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <span role="columnheader" key={d}>
              {d}
            </span>
          ))}
        </div>
        {Array.from({ length: Math.ceil((first + days) / 7) }, (_, row) => (
          <div role="row" key={row}>
            {Array.from({ length: 7 }, (_, col) => {
              const day = row * 7 + col - first + 1;
              if (day < 1 || day > days)
                return <span role="gridcell" key={col} />;
              const date = new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  day,
                  12,
                ),
                key = localDay(date);
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={col}
                  data-day={key}
                  aria-selected={selected === key}
                  aria-current={key === today ? "date" : undefined}
                  aria-label={new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "full",
                  }).format(date)}
                  disabled={disabled || !allowed(key)}
                  tabIndex={key === activeDay ? 0 : -1}
                  onClick={() => {
                    setFocusDay(key);
                    onChange(`${key}T${time}`);
                  }}
                  onKeyDown={(e) => {
                    const offset: Record<string, number> = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                      Home: -col,
                      End: 6 - col,
                    };
                    const next = new Date(date);
                    if (e.key in offset)
                      next.setDate(next.getDate() + offset[e.key]);
                    else if (e.key === "PageUp" || e.key === "PageDown") {
                      const nextMonth = new Date(
                        date.getFullYear(),
                        date.getMonth() + (e.key === "PageUp" ? -1 : 1),
                        1,
                      );
                      next.setFullYear(
                        nextMonth.getFullYear(),
                        nextMonth.getMonth(),
                        Math.min(
                          day,
                          new Date(
                            nextMonth.getFullYear(),
                            nextMonth.getMonth() + 1,
                            0,
                          ).getDate(),
                        ),
                      );
                    } else return;
                    e.preventDefault();
                    const nextKey = localDay(next);
                    if (!allowed(nextKey)) return;
                    focusRequested.current = true;
                    setFocusDay(nextKey);
                    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="schedule-time">
        <label htmlFor={timeId}>
          <StudioIcon name="clock" size={14} /> Giờ xuất bản
        </label>
        <input
          id={timeId}
          type="time"
          value={time}
          disabled={disabled}
          required
          onChange={(e) => {
            setTime(e.target.value);
            if (selected) onChange(`${selected}T${e.target.value}`);
          }}
        />
      </div>
      <div className="schedule-zone">{timezone}</div>
      <div
        className={`schedule-summary ${valid ? "is-ready" : ""}`}
        aria-live="polite"
        hidden={!selected}
      >
        <StudioIcon name={valid ? "check" : "clock"} size={15} />
        <span>
          {valid && instant ? (
            <>
              <strong>{scheduleLabel(instant)}</strong>
            </>
          ) : selected ? (
            "Chọn giờ sau hiện tại ít nhất một phút."
          ) : (
            ""
          )}
        </span>
      </div>
    </section>
  );
}
