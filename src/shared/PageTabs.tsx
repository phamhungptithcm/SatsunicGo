import { useState, type ReactNode } from "react";
import "./page-tabs.css";

export type PageTabItem<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

/** Manual activation keeps arrow-key focus movement from triggering reads. */
export function PageTabs<T extends string>({
  id,
  label,
  items,
  value,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  items: readonly PageTabItem<T>[];
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  const [focused, setFocused] = useState<T | null>(null);
  const enabled = items.filter((item) => !item.disabled && !disabled);
  const stop = enabled.some((item) => item.value === focused)
    ? focused
    : enabled.some((item) => item.value === value)
      ? value
      : enabled[0]?.value;
  return (
    <div
      className="pageTabs"
      role="tablist"
      aria-label={label}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(null);
      }}
    >
      {items.map((item) => (
        <button
          type="button"
          className="pageTab"
          key={item.value}
          id={`${id}-tab-${item.value}`}
          role="tab"
          aria-selected={value === item.value}
          aria-controls={`${id}-panel-${item.value}`}
          tabIndex={stop === item.value ? 0 : -1}
          disabled={disabled || item.disabled}
          onFocus={() => setFocused(item.value)}
          onClick={() => {
            setFocused(item.value);
            if (item.value !== value) onChange(item.value);
          }}
          onKeyDown={(event) => {
            if (!enabled.length) return;
            const index = enabled.findIndex((tab) => tab.value === item.value);
            let next: number;
            switch (event.key) {
              case "ArrowLeft":
                next = (index - 1 + enabled.length) % enabled.length;
                break;
              case "ArrowRight":
                next = (index + 1) % enabled.length;
                break;
              case "Home":
                next = 0;
                break;
              case "End":
                next = enabled.length - 1;
                break;
              default:
                return;
            }
            event.preventDefault();
            const target = enabled[next].value;
            setFocused(target);
            const button = document.getElementById(`${id}-tab-${target}`);
            button?.focus();
            button?.scrollIntoView({ block: "nearest", inline: "nearest" });
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
