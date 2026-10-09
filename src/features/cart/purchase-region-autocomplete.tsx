import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import {
  filterRegionOptions,
  indexRegionOptions,
  regionActiveIndex,
  type PurchaseRegionOption,
} from "./purchase-region-search";

type Props = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "aria-labelledby" | "aria-describedby" | "aria-invalid"
> & {
  id: string;
  label: string;
  options: readonly PurchaseRegionOption[];
  value: string;
  placeholder: string;
  disabled?: boolean;
  onSelect: (option: PurchaseRegionOption | null) => void;
};

/** Only an explicit directory choice supplies a code; search text is not an address. */
export function PurchaseRegionAutocomplete({
  label,
  options,
  value,
  placeholder,
  disabled = false,
  onSelect,
  ...inputProps
}: Props) {
  const [draft, setDraft] = useState<{ text: string; forValue: string } | null>(
    null,
  );
  const [opened, setOpened] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const composing = useRef(false);
  const selected = options.find((option) => option.code === value);
  const query = draft?.forValue === value ? draft.text : "";
  const index = useMemo(() => indexRegionOptions(options), [options]);
  const matches = useMemo(
    () => filterRegionOptions(index, query),
    [index, query],
  );
  const open = opened && !disabled;
  const listId = `${inputProps.id}-options`;
  const labelId = inputProps["aria-labelledby"] ?? `${inputProps.id}-label`;
  const activeOption = open ? matches[active] : undefined;

  useEffect(() => {
    const popup = list.current;
    const option = popup?.children[active] as HTMLElement | undefined;
    if (!open || !popup || !option) return;
    // Scroll only the popup. scrollIntoView can also move the checkout page.
    if (option.offsetTop < popup.scrollTop) popup.scrollTop = option.offsetTop;
    else if (
      option.offsetTop + option.offsetHeight >
      popup.scrollTop + popup.clientHeight
    )
      popup.scrollTop =
        option.offsetTop + option.offsetHeight - popup.clientHeight;
  }, [active, open, matches]);

  function choose(option: PurchaseRegionOption) {
    if (disabled || input.current?.matches(":disabled")) return;
    if (option.code !== value) onSelect(option);
    setDraft(null);
    setOpened(false);
    setActive(-1);
  }

  return (
    <>
      <label
        htmlFor={inputProps.id}
        id={labelId}
        className="purchaseFieldLabel"
      >
        {label}{" "}
        <span className="requiredMark" aria-hidden="true">
          *
        </span>
      </label>
      <div className="purchaseRegionAutocomplete">
        <input
          {...inputProps}
          id={inputProps.id}
          ref={input}
          type="text"
          role="combobox"
          required
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          maxLength={120}
          placeholder={placeholder}
          value={
            draft?.forValue === value ? draft.text : (selected?.name ?? "")
          }
          aria-autocomplete="list"
          aria-labelledby={labelId}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            activeOption ? `${listId}-${activeOption.code}` : undefined
          }
          onFocus={() => setOpened(true)}
          onClick={() => setOpened(true)}
          onChange={(event) => {
            setDraft({ text: event.target.value, forValue: "" });
            setOpened(true);
            setActive(0);
            if (value) onSelect(null);
          }}
          onBlur={() => {
            setOpened(false);
            setActive(-1);
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={(event) => {
            if (
              composing.current ||
              event.nativeEvent.isComposing ||
              event.keyCode === 229
            )
              return;
            if (
              ["ArrowDown", "ArrowUp"].includes(event.key) ||
              (open && ["Home", "End"].includes(event.key))
            ) {
              event.preventDefault();
              setOpened(true);
              setActive(
                regionActiveIndex(
                  event.key,
                  open ? active : -1,
                  matches.length,
                ),
              );
            } else if (event.key === "Enter" && open) {
              event.preventDefault();
              if (activeOption) choose(activeOption);
              else setOpened(false);
            } else if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              setOpened(false);
              setActive(-1);
            }
          }}
        />
        <span className="purchaseRegionChevron" aria-hidden="true">
          ⌄
        </span>
        {open && (
          <ul
            ref={list}
            id={listId}
            className="purchaseRegionOptions"
            role="listbox"
            aria-labelledby={labelId}
          >
            {matches.map((option, position) => (
              <li
                id={`${listId}-${option.code}`}
                key={option.code}
                role="option"
                aria-selected={option.code === value}
                className={position === active ? "isActive" : undefined}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                <span>{option.name}</span>
                {option.code === value && <span aria-hidden="true">✓</span>}
              </li>
            ))}
            {!matches.length && (
              <li className="purchaseRegionEmpty" role="presentation">
                Không tìm thấy. Thử tên khác hoặc gõ không dấu.
              </li>
            )}
          </ul>
        )}
        <span
          className="purchaseRegionStatus"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {open
            ? matches.length
              ? `${matches.length} kết quả. Dùng phím mũi tên và Enter để chọn.`
              : "Không tìm thấy địa danh phù hợp."
            : ""}
        </span>
      </div>
    </>
  );
}
