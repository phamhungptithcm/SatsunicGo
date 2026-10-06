import { auth } from "../../../shared/firebase";
import { privateStudioImage } from "./media";

import {
  fetchImageFile,
  imageDimension,
  singleImageUrl,
  transferFiles,
} from "./editor-image";
import { BubbleMenu } from "@tiptap/react/menus";
import { useEditor, EditorContent } from "@tiptap/react";
import { DiagramCodeBlock } from "./diagram-code-block";
import { pastedMermaid } from "./mermaid-source";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import type { Attributes } from "@tiptap/core";
import type { RichNode } from "../../../../packages/domain/blog-studio";
import { safeUrl } from "../../../../packages/domain/blog-studio";
import { BlogIcon as StudioIcon } from "./source-ui";
import { BlogDialog as StudioDialog } from "./source-dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { closeHistory } from "@tiptap/pm/history";
import {
  NodeSelection,
  TextSelection,
  type SelectionBookmark,
} from "@tiptap/pm/state";
import type { Editor as TiptapEditor } from "@tiptap/react";
import {
  blockTransaction,
  imageFileError,
  matchingSlashItems,
  slashRange,
  type SlashId,
} from "./editor-actions";
const EditorImage = Image.extend({
  addAttributes() {
    const parent: Attributes = this.parent?.() ?? {};
    return {
      ...parent,
      alt: { ...parent?.alt, default: "" },
      title: { ...parent?.title, default: "" },
      width: {
        default: null,
        parseHTML: (element) =>
          imageDimension(Number(element.getAttribute("width"))),
      },
      height: {
        default: null,
        parseHTML: (element) =>
          imageDimension(Number(element.getAttribute("height"))),
      },
    };
  },
  addNodeView() {
    const createParentView = this.parent?.();
    if (!createParentView) return null;
    return (props) => {
      const view = createParentView(props);
      const update = view.update?.bind(view);
      if (!update) return view;
      // The resizable parent retains its handles, events and lifecycle, but does
      // not apply width/height changes from toolbar, undo or reset transactions.
      view.update = (node, decorations, innerDecorations) => {
        const accepted = update(node, decorations, innerDecorations);
        if (accepted) {
          const img =
            view.dom instanceof HTMLImageElement
              ? view.dom
              : view.dom.querySelector("img");
          if (img) {
            const width = imageDimension(node.attrs.width);
            const height = imageDimension(node.attrs.height);
            img.style.width = width === null ? "" : `${width}px`;
            img.style.height = height === null ? "" : `${height}px`;
          }
        }
        return accepted;
      };
      return view;
    };
  },
});
export function RichEditor({
  body,
  onChange,
  onImage,
  onUploadImage,
  onUploadedAlt,
  onError,
}: {
  body: RichNode;
  onChange: (b: RichNode) => void;
  onImage: () => Promise<string | null>;
  onUploadImage: (file: File) => Promise<string>;
  onUploadedAlt?: () => string;
  onError: (message: string) => void;
}) {
  const [link, setLink] = useState<string | null>(null),
    [linkError, setLinkError] = useState("");
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
  const writingRoot = useRef<HTMLElement | null>(null);
  const [activeBlock, setActiveBlock] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slash, setSlash] = useState<{
    from: number;
    to: number;
    query: string;
    left: number;
    top: number;
  } | null>(null);
  const [commandIndex, setCommandIndex] = useState(0);
  const selectedCommand = useRef(0);
  const dismissedSlash = useRef<number | null>(null);
  const imageBookmark = useRef<SelectionBookmark | null>(null);
  const pendingUpload = useRef(false);
  const [editingImage, setEditingImage] = useState(false);
  const alive = useRef(true);
  const imageDownload = useRef<AbortController | null>(null);
  const commands = useRef<(id: SlashId, instance: TiptapEditor) => void>(
    () => {},
  );
  const pickImage = useRef<() => void>(() => {});
  const files = useRef<
    (file: File | string, instance: TiptapEditor, pos?: number) => void
  >(() => {});
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      imageDownload.current?.abort();
    };
  }, []);
  useEffect(() => {
    selectedCommand.current = commandIndex;
  }, [commandIndex]);
  useEffect(() => {
    if (!focusMode) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const isolated: { element: HTMLElement; previous: boolean }[] = [];
    let current: HTMLElement | null = writingRoot.current;
    while (current?.parentElement && current.parentElement !== document.body) {
      for (const sibling of current.parentElement.children) {
        if (sibling !== current && sibling instanceof HTMLElement) {
          isolated.push({ element: sibling, previous: sibling.inert });
          sibling.inert = true;
        }
      }
      current = current.parentElement;
    }
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !document.querySelector('dialog[open], [role="dialog"]')
      )
        setFocusMode(false);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      isolated.forEach(({ element, previous }) => {
        element.inert = previous;
      });
      document.removeEventListener("keydown", escape);
    };
  }, [focusMode]);
  const syncCommands = useCallback((instance: TiptapEditor) => {
    const root = writingRoot.current;
    const pos = instance.state.selection.$from.depth
      ? instance.state.selection.$from.before(1)
      : instance.state.selection.from;
    const dom = instance.view.nodeDOM(pos);
    if (root && dom instanceof HTMLElement) {
      const blockRect = dom.getBoundingClientRect(),
        rootRect = root.getBoundingClientRect();
      setActiveBlock({
        top: blockRect.top - rootRect.top + root.scrollTop,
        left: Math.max(
          0,
          blockRect.left - rootRect.left + root.scrollLeft - 26,
        ),
      });
    }
    const range = slashRange(instance.state);
    if (!range || !instance.isFocused) {
      dismissedSlash.current = null;
      setSlash(null);
      return;
    }
    if (dismissedSlash.current === range.from) return;
    const coords = instance.view.coordsAtPos(range.to);
    selectedCommand.current = 0;
    setCommandIndex(0);
    setSlash({
      ...range,
      left: Math.max(12, Math.min(coords.left, window.innerWidth - 260)),
      top: Math.max(12, Math.min(coords.bottom + 8, window.innerHeight - 340)),
    });
  }, []);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        link: { openOnClick: false },
      }),
      EditorImage.configure({
        resize: {
          enabled: true,
          directions: ["bottom-left", "bottom-right"],
          minWidth: 48,
          minHeight: 24,
          alwaysPreserveAspectRatio: true,
        },
      }),
      DiagramCodeBlock,
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: body,
    immediatelyRender: false,
    editorProps: {
      transformPastedHTML: (html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll("img").forEach((img) => {
          if (!/^\/media\/[a-zA-Z0-9_-]+$/.test(img.getAttribute("src") ?? ""))
            img.remove();
        });
        return doc.body.innerHTML;
      },
      handleKeyDown: (view, event) => {
        if (event.isComposing) return false;
        const range = slashRange(view.state);
        if (!range || dismissedSlash.current === range.from) return false;
        const options = matchingSlashItems(range.query);
        if (event.key === "Escape") {
          dismissedSlash.current = range.from;
          setSlash(null);
          return true;
        }
        if (!options.length) return false;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          selectedCommand.current =
            (selectedCommand.current +
              (event.key === "ArrowDown" ? 1 : -1) +
              options.length) %
            options.length;
          setCommandIndex(selectedCommand.current);
          return true;
        }
        if (event.key === "Enter" && editor) {
          commands.current(
            options[Math.min(selectedCommand.current, options.length - 1)].id,
            editor,
          );
          return true;
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !event.dataTransfer || !editor) return false;
        const dropped = transferFiles(event.dataTransfer);
        const src = singleImageUrl(
          event.dataTransfer.getData("text/html"),
          event.dataTransfer.getData("text/uri-list") ||
            event.dataTransfer.getData("text/plain"),
        );
        if (!dropped.length && !src) {
          if (event.dataTransfer.getData("text/html").includes("<img")) {
            event.preventDefault();
            onError("Kéo từng ảnh hoặc file ảnh vào bài nhé.");
            return true;
          }
          return false;
        }
        event.preventDefault();
        if (dropped.length > 1) {
          onError("Thêm từng ảnh một nhé.");
          return true;
        }
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;
        files.current(dropped[0] || src!, editor, pos);
        return true;
      },
      handlePaste: (view, event) => {
        const data = event.clipboardData;
        const pasted = data ? transferFiles(data) : [];
        const src = singleImageUrl(
          data?.getData("text/html") ?? "",
          data?.getData("text/plain")?.trim() ?? "",
        );
        if (editor && (pasted.length || src)) {
          event.preventDefault();
          if (pasted.length > 1) onError("Thêm từng ảnh một nhé.");
          else files.current(pasted[0] || src!, editor);
          return true;
        }
        if (data?.getData("text/html").includes("<img")) {
          const doc = new DOMParser().parseFromString(
            data.getData("text/html"),
            "text/html",
          );
          if (
            Array.from(doc.querySelectorAll("img")).some(
              (img) =>
                !/^\/media\/[a-zA-Z0-9_-]+$/.test(
                  img.getAttribute("src") ?? "",
                ),
            )
          )
            onError("Ảnh từ trang khác cần dán riêng hoặc kéo file vào bài.");
        }
        const source = pastedMermaid(
          event.clipboardData?.getData("text/plain") ?? "",
        );
        if (!source) return false;
        const node = view.state.schema.nodes.codeBlock.create(
          { language: "mermaid" },
          view.state.schema.text(source),
        );
        view.dispatch(
          view.state.tr.replaceSelectionWith(node).scrollIntoView(),
        );
        return true;
      },
      attributes: {
        role: "textbox",
        "aria-label": "Nội dung bài viết",
        "aria-multiline": "true",
      },
    },
    onTransaction: ({ transaction }) => {
      if (imageBookmark.current)
        imageBookmark.current = imageBookmark.current.map(transaction.mapping);
    },
    onSelectionUpdate: ({ editor }) => syncCommands(editor),
    onFocus: ({ editor }) => syncCommands(editor),
    onBlur: () => setSlash(null),
    onUpdate: ({ editor, transaction }) => {
      if (transaction.docChanged) onChange(editor.getJSON() as RichNode);
      syncCommands(editor);
    },
  });
  useEffect(() => {
    if (!editor) return;
    async function chooseImage(input?: File | string, pos?: number) {
      if (pendingUpload.current || imageBookmark.current) {
        onError("Hoàn tất ảnh đang chọn trước nhé.");
        return;
      }
      if (input instanceof File) {
        const error = imageFileError(input);
        if (error) {
          onError(error);
          return;
        }
      }
      if (!editor || editor.isDestroyed) return;
      if (pos !== undefined)
        editor.view.dispatch(
          editor.state.tr.setSelection(
            TextSelection.near(editor.state.doc.resolve(pos)),
          ),
        );
      imageBookmark.current = editor.state.selection.getBookmark();
      setEditingImage(false);
      pendingUpload.current = true;
      setUploading(true);
      try {
        imageDownload.current = new AbortController();
        const file =
          typeof input === "string"
            ? await fetchImageFile(input, imageDownload.current.signal)
            : input;
        if (file) {
          const error = imageFileError(file);
          if (error) throw new Error(error);
        }
        if (!alive.current || editor.isDestroyed) return;
        const src = file ? await onUploadImage(file) : await onImage();
        if (!alive.current || editor.isDestroyed) return;
        const alt = onUploadedAlt?.() ?? "";
        if (src && input) {
          const selection = imageBookmark.current?.resolve(editor.state.doc);
          if (selection)
            editor.view.dispatch(editor.state.tr.setSelection(selection));
          editor.view.dispatch(closeHistory(editor.state.tr));
          if (selection instanceof NodeSelection)
            editor
              .chain()
              .focus()
              .insertContentAt(selection.to, {
                type: "image",
                attrs: { src, alt },
              })
              .run();
          else editor.chain().focus().setImage({ src, alt }).run();
          imageBookmark.current = null;
        } else if (src) setImage({ src, alt });
        else imageBookmark.current = null;
      } catch (error) {
        imageBookmark.current = null;
        if (alive.current)
          onError(
            error instanceof Error
              ? error.message
              : "Không tải được ảnh. Thử lại nhé.",
          );
      } finally {
        imageDownload.current = null;
        pendingUpload.current = false;
        if (alive.current) setUploading(false);
      }
    }
    pickImage.current = () => {
      void chooseImage();
    };
    files.current = (file, _instance, pos) => {
      void chooseImage(file, pos);
    };
    commands.current = (id, instance) => {
      const range = slashRange(instance.state);
      if (!range) return;
      if (id === "image" && (pendingUpload.current || imageBookmark.current)) {
        onError("Hoàn tất ảnh đang chọn trước nhé.");
        return;
      }
      instance
        .chain()
        .focus()
        .deleteRange({ from: range.from, to: range.to })
        .run();
      setSlash(null);
      if (id === "image") {
        void chooseImage();
        return;
      }
      const chain = instance.chain().focus();
      switch (id) {
        case "h2":
          chain.setHeading({ level: 2 }).run();
          break;
        case "h3":
          chain.setHeading({ level: 3 }).run();
          break;
        case "list":
          chain.toggleBulletList().run();
          break;
        case "ordered":
          chain.toggleOrderedList().run();
          break;
        case "quote":
          chain.toggleBlockquote().run();
          break;
        case "code":
          chain.setCodeBlock().run();
          break;
        case "table":
          chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          break;
      }
    };
    const move = () => {
      setSlash(null);
      if (!editor.isDestroyed)
        editor.view.dispatch(
          editor.state.tr.setMeta("editorImageMenu", "updatePosition"),
        );
    };
    window.addEventListener("scroll", move, true);
    window.addEventListener("resize", move);
    return () => {
      window.removeEventListener("scroll", move, true);
      window.removeEventListener("resize", move);
    };
  }, [editor, onImage, onUploadImage, onUploadedAlt, onError]);
  useEffect(() => {
    if (!editor) return;
    const frame = requestAnimationFrame(() => {
      if (focusMode) editor.commands.focus();
      syncCommands(editor);
    });
    return () => cancelAnimationFrame(frame);
  }, [editor, focusMode, syncCommands]);
  useEffect(() => {
    if (!editor) return;
    const uid = auth?.currentUser?.uid ?? "";
    const urls = new Map<string, string>(),
      pending = new Set<string>();
    let cancelled = false;
    const resolve = () => {
      if (cancelled || auth?.currentUser?.uid !== uid) return;
      editor.view.dom
        .querySelectorAll<HTMLImageElement>("img")
        .forEach((img) => {
          const canonical = img.getAttribute("src") ?? "";
          const id = /^\/media\/([a-zA-Z0-9-]{1,80})$/.exec(canonical)?.[1];
          if (!id) return;
          if (urls.has(id)) {
            img.src = urls.get(id)!;
            return;
          }
          if (pending.has(id)) return;
          pending.add(id);
          void privateStudioImage(id, uid)
            .then((url) => {
              if (cancelled || auth?.currentUser?.uid !== uid) {
                URL.revokeObjectURL(url);
                return;
              }
              urls.set(id, url);
              resolve();
            })
            .catch(() => {
              if (!cancelled)
                onError("Chưa mở được ảnh bản nháp. Thử mở lại bài viết.");
            });
        });
    };
    const observer = new MutationObserver(resolve);
    observer.observe(editor.view.dom, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
    resolve();
    return () => {
      cancelled = true;
      observer.disconnect();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [editor, onError]);
  function editBlock(action: "up" | "down" | "duplicate" | "delete") {
    if (!editor) return;
    const transaction = blockTransaction(editor.state, action);
    if (transaction) {
      editor.view.dispatch(transaction);
      editor.commands.focus();
    }
    writingRoot.current
      ?.querySelector<HTMLDetailsElement>(".writing-block-menu")
      ?.removeAttribute("open");
  }
  if (!editor)
    return (
      <div className="state-card" role="status">
        <div className="skeleton" />
        <div className="skeleton short" />
        <p>Đang mở trình soạn thảo…</p>
      </div>
    );
  return (
    <section
      ref={writingRoot}
      className={`rich-writing ${focusMode ? "rich-writing-focus" : ""}`}
      aria-label="Trình soạn thảo"
    >
      {focusMode && (
        <div className="writing-focus-header">
          <strong>Đang viết</strong>
          <span>Esc để quay lại</span>
          <button
            type="button"
            onClick={() => setFocusMode(false)}
            aria-label="Thoát chế độ tập trung"
            title="Thoát (Esc)"
          >
            <StudioIcon name="close" size={18} />
          </button>
        </div>
      )}
      <BubbleMenu
        editor={editor}
        className="editor-selection-tools"
        shouldShow={({ editor, state }) =>
          !state.selection.empty &&
          state.selection.$from.parent.inlineContent &&
          !editor.isActive("codeBlock")
        }
      >
        <div
          role="toolbar"
          aria-label="Định dạng đoạn được chọn"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            aria-label="In đậm"
            aria-pressed={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            aria-label="In nghiêng"
            aria-pressed={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            aria-label="Gạch ngang"
            aria-pressed={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <s>S</s>
          </button>
          <button
            type="button"
            aria-label="Mã nội dòng"
            aria-pressed={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <StudioIcon name="code" size={15} />
          </button>
          <button
            type="button"
            aria-label="Chèn liên kết"
            aria-pressed={editor.isActive("link")}
            onClick={() => {
              setLinkError("");
              setLink(String(editor.getAttributes("link").href ?? ""));
            }}
          >
            <StudioIcon name="link" size={15} />
          </button>
        </div>
      </BubbleMenu>
      <BubbleMenu
        editor={editor}
        pluginKey="editorImageMenu"
        className="editor-image-tools"
        options={{
          strategy: "fixed",
          placement: "top",
          shift: { padding: 8 },
          flip: true,
        }}
        shouldShow={({ editor }) => editor.isActive("image")}
      >
        <div
          role="toolbar"
          aria-label="Chỉnh ảnh"
          onMouseDown={(event) => event.preventDefault()}
        >
          {[50, 75, 100].map((percent) => (
            <button
              type="button"
              key={percent}
              aria-label={`Chiều rộng ảnh ${percent}%`}
              onClick={() => {
                const node = editor.view.nodeDOM(editor.state.selection.from);
                const img =
                  node instanceof HTMLElement
                    ? node instanceof HTMLImageElement
                      ? node
                      : node.querySelector("img")
                    : null;
                const available =
                  writingRoot.current?.querySelector(".tiptap")?.clientWidth ??
                  600;
                const width = Math.round((available * percent) / 100);
                const ratio =
                  img?.naturalWidth && img.naturalHeight
                    ? img.naturalHeight / img.naturalWidth
                    : Number(editor.getAttributes("image").height) /
                      Number(editor.getAttributes("image").width);
                editor
                  .chain()
                  .focus()
                  .updateAttributes("image", {
                    width,
                    height:
                      Number.isFinite(ratio) && ratio > 0
                        ? Math.max(1, Math.round(width * ratio))
                        : null,
                  })
                  .run();
              }}
            >
              {percent}%
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .updateAttributes("image", { width: null, height: null })
                .run()
            }
          >
            Tự cân
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingImage(true);
              imageBookmark.current = editor.state.selection.getBookmark();
              setImage({
                src: String(editor.getAttributes("image").src),
                alt: String(editor.getAttributes("image").alt ?? ""),
              });
            }}
          >
            Mô tả
          </button>
        </div>
      </BubbleMenu>
      <div className="formatbar" role="toolbar" aria-label="Định dạng nội dung">
        <select
          aria-label="Kiểu đoạn văn"
          value={
            editor.isActive("heading", { level: 2 })
              ? "2"
              : editor.isActive("heading", { level: 3 })
                ? "3"
                : "p"
          }
          onChange={(e) => {
            if (e.target.value === "p")
              editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({ level: Number(e.target.value) as 2 | 3 })
                .run();
          }}
        >
          <option value="p">Văn bản</option>
          <option value="2">Tiêu đề H2</option>
          <option value="3">Tiêu đề H3</option>
        </select>
        <button
          type="button"
          aria-label="Chèn bảng"
          title="Chèn bảng 3 × 3"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <StudioIcon name="grid" size={16} />
        </button>
        <span className="divider" />
        <button
          type="button"
          aria-label="In đậm"
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          aria-label="In nghiêng"
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          aria-label="Liên kết"
          onClick={() => {
            setLinkError("");
            setLink(String(editor.getAttributes("link").href ?? ""));
          }}
        >
          <StudioIcon name="link" size={15} />
        </button>
        <span className="divider" />
        <button
          type="button"
          aria-label="Danh sách"
          aria-pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <StudioIcon name="list" size={16} />
        </button>
        <button
          type="button"
          aria-label="Trích dẫn"
          aria-pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <StudioIcon name="quote" size={15} />
        </button>
        <button
          type="button"
          aria-label="Code"
          aria-pressed={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <StudioIcon name="code" size={16} />
        </button>
        <span className="divider" />
        <button
          type="button"
          aria-label="Chèn ảnh hoặc GIF"
          disabled={uploading}
          onClick={() => pickImage.current()}
        >
          <StudioIcon name="image" size={16} />
        </button>
        <button
          type="button"
          aria-label="Hoàn tác"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <StudioIcon name="history" size={16} />
        </button>
        <button
          type="button"
          aria-label="Làm lại"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <span style={{ display: "inline-flex", transform: "scaleX(-1)" }}>
            <StudioIcon name="history" size={16} />
          </span>
        </button>
        <button
          type="button"
          className="writing-focus-toggle"
          aria-label={focusMode ? "Thoát chế độ tập trung" : "Chế độ tập trung"}
          title="Chế độ tập trung"
          aria-pressed={focusMode}
          onClick={() => setFocusMode(!focusMode)}
        >
          ⛶
        </button>
      </div>
      <div className="writing-context-row">
        <span role="status">
          {uploading ? "Đang tải ảnh…" : "Gõ / ở dòng mới để chèn nhanh"}
        </span>
      </div>
      {activeBlock && (
        <details className="writing-block-menu" style={activeBlock}>
          <summary
            aria-label="Thao tác với khối hiện tại"
            title="Thao tác với khối hiện tại"
          >
            ⋮
          </summary>
          <div role="group" aria-label="Thao tác khối">
            <button type="button" onClick={() => editBlock("up")}>
              ↑ Lên
            </button>
            <button type="button" onClick={() => editBlock("down")}>
              ↓ Xuống
            </button>
            <button type="button" onClick={() => editBlock("duplicate")}>
              Nhân đôi
            </button>
            <button type="button" onClick={() => editBlock("delete")}>
              Xóa
            </button>
          </div>
        </details>
      )}
      {slash && (
        <div
          className="writing-slash-menu"
          role="group"
          aria-label="Chèn nội dung"
          style={{ left: slash.left, top: slash.top }}
        >
          <span>Chèn nội dung</span>
          {matchingSlashItems(slash.query).map((item, index) => (
            <button
              type="button"
              key={item.id}
              aria-current={index === commandIndex ? "true" : undefined}
              className={index === commandIndex ? "selected" : ""}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commands.current(item.id, editor)}
            >
              {item.label}
            </button>
          ))}
          {!matchingSlashItems(slash.query).length && (
            <p>Không tìm thấy. Thử từ khác nhé.</p>
          )}
        </div>
      )}
      {editor.isActive("table") && (
        <div className="table-actions" role="toolbar" aria-label="Chỉnh bảng">
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            + Hàng
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            + Cột
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            Xóa hàng
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            Xóa cột
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Xóa bảng
          </button>
        </div>
      )}
      <div className="editor-prose">
        <EditorContent editor={editor} />
      </div>
      {image && (
        <StudioDialog
          title={editingImage ? "Mô tả ảnh" : "Thêm ảnh vào bài"}
          iconClose
          onClose={() => {
            setImage(null);
            imageBookmark.current = null;
          }}
        >
          {/* Uploaded image is private until the article is published. */}
          <img
            src={image.src}
            alt={image.alt}
            style={{
              maxWidth: "100%",
              maxHeight: 220,
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const selection = imageBookmark.current?.resolve(
                  editor.state.doc,
                );
                if (selection)
                  editor.view.dispatch(editor.state.tr.setSelection(selection));
                if (editingImage)
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("image", { alt: image.alt })
                    .run();
                else editor.chain().focus().setImage(image).run();
                imageBookmark.current = null;
                setImage(null);
              } catch {
                onError(
                  "Vị trí chèn đã thay đổi. Chọn lại vị trí rồi thử nhé.",
                );
              }
            }}
          >
            <div className="field">
              <label>
                Mô tả ảnh
                <input
                  autoFocus
                  value={image.alt}
                  onChange={(e) => setImage({ ...image, alt: e.target.value })}
                  maxLength={300}
                  placeholder="Mô tả nội dung ảnh cho người đọc"
                />
              </label>
            </div>
            <p className="private-note">
              Mô tả giúp người dùng trình đọc màn hình hiểu nội dung ảnh.
            </p>
            <button className="button primary">
              {editingImage ? "Lưu" : "Chèn ảnh"}
            </button>
          </form>
        </StudioDialog>
      )}
      {link !== null && (
        <StudioDialog title="Chèn liên kết" onClose={() => setLink(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!link) {
                editor.chain().unsetLink().run();
                setLink(null);
                return;
              }
              if (!safeUrl(link)) {
                setLinkError(
                  "Liên kết cần bắt đầu bằng https:// hoặc http://.",
                );
                return;
              }
              editor
                .chain()
                .extendMarkRange("link")
                .setLink({ href: link })
                .run();
              setLink(null);
            }}
          >
            <div className="field">
              <label>
                Liên kết
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://"
                  autoFocus
                />
              </label>
            </div>
            <p role="status">{linkError}</p>
            <button className="button primary">Lưu liên kết</button>
          </form>
        </StudioDialog>
      )}
    </section>
  );
}
