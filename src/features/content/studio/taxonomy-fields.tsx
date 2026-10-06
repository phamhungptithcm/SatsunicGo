import { useEffect, useId, useRef, useState } from "react";
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Chưa tạo được chuyên mục.";
type ToastKind = "success" | "warning" | "error" | "info";
import { addTag, MAX_TAGS, taxonomyKey } from "./taxonomy-input";

export function TaxonomyFields({
  category,
  categories,
  canCreate,
  tags,
  onCategory,
  onTags,
  notify,
  onPending,
  onCreateCategory,
}: {
  onCreateCategory: (name: string) => Promise<{ name: string }>;
  category: string;
  categories: string[];
  canCreate: boolean;
  tags: string[];
  onCategory: (name: string) => void;
  onTags: (tags: string[]) => void;
  notify: (text: string, kind: ToastKind) => void;
  onPending: (pending: boolean) => void;
}) {
  const id = useId();
  const [categoryText, setCategoryText] = useState(category);
  const [options, setOptions] = useState(() => [...new Set(categories)]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    list.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const [creating, setCreating] = useState(false);
  const pending = useRef(false);
  const composing = useRef(false);
  const tagComposing = useRef(false);
  const [tagText, setTagText] = useState("");
  const matches = options.filter((name) =>
    taxonomyKey(name).includes(taxonomyKey(categoryText)),
  );
  const exact = options.find(
    (name) => taxonomyKey(name) === taxonomyKey(categoryText),
  );
  const newName = categoryText.trim();
  const choices = [...matches, ...(!exact && newName ? [newName] : [])];

  async function commitCategory(value: string) {
    if (pending.current) return;
    const name = value.trim();
    if (!name) {
      setCategoryText(category);
      setOpen(false);
      return;
    }
    if (name.length > 80) {
      notify("Tên chuyên mục tối đa 80 ký tự.", "warning");
      return;
    }
    const existing = options.find(
      (option) => taxonomyKey(option) === taxonomyKey(name),
    );
    if (existing || taxonomyKey(name) === taxonomyKey(category)) {
      const selected = existing ?? category;
      setCategoryText(selected);
      if (selected !== category) onCategory(selected);
      setOpen(false);
      return;
    }
    if (!canCreate) {
      notify(
        "Chỉ chủ doanh nghiệp được tạo chuyên mục mới. Hãy chọn chuyên mục có sẵn.",
        "warning",
      );
      setOpen(false);
      return;
    }
    pending.current = true;
    onPending(true);
    setCreating(true);
    setOpen(false);
    try {
      const result = await onCreateCategory(name);
      setOptions((current) =>
        current.some(
          (option) => taxonomyKey(option) === taxonomyKey(result.name),
        )
          ? current
          : [...current, result.name],
      );
      setCategoryText(result.name);
      onCategory(result.name);
      notify("Đã chọn chuyên mục.", "success");
    } catch (error) {
      notify(
        error instanceof Error && error.message === "CATEGORY_LIMIT"
          ? "Danh sách chuyên mục đã đạt giới hạn. Hãy chọn mục có sẵn."
          : message(error),
        "error",
      );
    } finally {
      pending.current = false;
      onPending(false);
      setCreating(false);
    }
  }
  function commitTag() {
    const result = addTag(tags, tagText);
    if (result.error) {
      notify(result.error, "warning");
      return;
    }
    if (result.tags && result.tags !== tags) onTags(result.tags);
    setTagText("");
  }
  return (
    <>
      <div className="field category-autocomplete">
        <label htmlFor={`${id}-category`}>Chuyên mục</label>
        <input
          id={`${id}-category`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && choices.length > 0}
          aria-controls={`${id}-categories`}
          aria-activedescendant={
            open && active >= 0 && active < choices.length
              ? `${id}-option-${active}`
              : undefined
          }
          value={categoryText}
          disabled={creating}
          autoComplete="off"
          onFocus={() => {
            setOpen(true);
            setActive(-1);
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onChange={(event) => {
            setCategoryText(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onBlur={() => {
            if (!composing.current) void commitCategory(categoryText);
            else setOpen(false);
          }}
          onKeyDown={(event) => {
            if (
              event.nativeEvent.isComposing ||
              event.nativeEvent.keyCode === 229 ||
              composing.current
            )
              return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((current) => {
                if (!choices.length) return -1;
                if (current < 0)
                  return event.key === "ArrowDown" ? 0 : choices.length - 1;
                return (
                  (current +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    choices.length) %
                  choices.length
                );
              });
            } else if (event.key === "Enter") {
              event.preventDefault();
              void commitCategory(
                open && active >= 0 ? choices[active] : categoryText,
              );
            } else if (event.key === "Escape") {
              event.preventDefault();
              setCategoryText(category);
              setOpen(false);
              setActive(-1);
            }
          }}
        />
        {open && choices.length > 0 && (
          <ul
            ref={list}
            id={`${id}-categories`}
            role="listbox"
            aria-label="Chuyên mục"
            className="category-options"
          >
            {choices.map((name, index) => (
              <li
                key={name}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={active === index}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  void commitCategory(name);
                }}
              >
                {index >= matches.length ? `Tạo chuyên mục “${name}”` : name}
              </li>
            ))}
          </ul>
        )}
        {creating && <small role="status">Đang tạo chuyên mục…</small>}
      </div>
      <div className="field">
        <label htmlFor={`${id}-tags`}>Tags</label>
        <div className="tag-input-group">
          {tags.map((tag, index) => (
            <span className="tag-chip" key={`${tag}-${index}`}>
              {tag}
              <button
                type="button"
                aria-label={`Xóa tag ${tag}`}
                onClick={() => onTags(tags.filter((_, at) => at !== index))}
              >
                ×
              </button>
            </span>
          ))}
          <input
            id={`${id}-tags`}
            value={tagText}
            placeholder="Nhập tag rồi nhấn Enter"
            aria-describedby={`${id}-tag-help`}
            onCompositionStart={() => {
              tagComposing.current = true;
            }}
            onCompositionEnd={() => {
              tagComposing.current = false;
            }}
            onChange={(event) => setTagText(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.nativeEvent.isComposing &&
                event.nativeEvent.keyCode !== 229 &&
                !tagComposing.current
              ) {
                event.preventDefault();
                commitTag();
              }
            }}
          />
        </div>
        <small id={`${id}-tag-help`}>
          {tags.length}/{MAX_TAGS} tag · Nhấn Enter để thêm
        </small>
      </div>
    </>
  );
}
