import { LoadingState } from "../../../shared/Loading";
import { useEffect, useState, type ReactNode } from "react";
import { auth } from "../../../shared/firebase";
import {
  validateBody,
  safeUrl,
  type RichNode,
} from "../../../../packages/domain/blog-studio";
import { privateStudioImage } from "./media";
import { MermaidDiagram } from "./MermaidDiagram";
import { isMermaidBlock } from "./mermaid-source";
function PrivateImage({ node }: { node: RichNode }) {
  const [url, setUrl] = useState(""),
    [failed, setFailed] = useState(false),
    src = String(node.attrs?.src ?? ""),
    uid = auth?.currentUser?.uid ?? "";
  useEffect(() => {
    let cancelled = false,
      blob: string | undefined;
    setUrl("");
    setFailed(false);
    void privateStudioImage(src.split("/").pop()!, uid)
      .then((value) => {
        blob = value;
        if (cancelled) {
          URL.revokeObjectURL(value);
          return;
        }
        setUrl(value);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (blob) URL.revokeObjectURL(blob);
    };
  }, [src, uid]);
  return url ? (
    <img
      src={url}
      alt={String(node.attrs?.alt ?? "")}
      width={node.attrs?.width as number | undefined}
      height={node.attrs?.height as number | undefined}
    />
  ) : (
    <>{failed ? <p role="status">{"Chưa mở được ảnh bản nháp."}</p> : <LoadingState overlay={false}>{"Đang mở ảnh…"}</LoadingState>}</>
  );
}
function nodeText(n: RichNode): string {
  return [n.text ?? "", ...(n.content ?? []).map(nodeText)].join("");
}
function render(n: RichNode, key: string, privateImages: boolean): ReactNode {
  const children = (n.content ?? []).map((x, i) =>
    render(x, `${key}-${i}`, privateImages),
  );
  if (n.type === "text") {
    let text: ReactNode = n.text ?? "";
    for (const m of n.marks ?? []) {
      if (m.type === "bold") text = <strong>{text}</strong>;
      if (m.type === "italic") text = <em>{text}</em>;
      if (m.type === "strike") text = <s>{text}</s>;
      if (m.type === "underline") text = <u>{text}</u>;
      if (m.type === "code") text = <code>{text}</code>;
      if (m.type === "link" && safeUrl(String(m.attrs?.href ?? "")))
        text = (
          <a
            href={String(m.attrs?.href)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {text}
          </a>
        );
    }
    return <span key={key}>{text}</span>;
  }
  switch (n.type) {
    case "doc":
      return <div key={key}>{children}</div>;
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading":
      return n.attrs?.level === 3 ? (
        <h3 key={key}>{children}</h3>
      ) : n.attrs?.level === 4 ? (
        <h4 key={key}>{children}</h4>
      ) : (
        <h2 key={key}>{children}</h2>
      );
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={Number(n.attrs?.start ?? 1)}>
          {children}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "codeBlock":
      return isMermaidBlock(n.attrs?.language, nodeText(n)) ? (
        <MermaidDiagram key={key} source={nodeText(n)} />
      ) : (
        <pre key={key}>
          <code>{nodeText(n)}</code>
        </pre>
      );
    case "image":
      return privateImages ? (
        <PrivateImage key={key} node={n} />
      ) : (
        <img
          key={key}
          src={String(n.attrs?.src)}
          alt={String(n.attrs?.alt ?? "")}
          width={n.attrs?.width as number | undefined}
          height={n.attrs?.height as number | undefined}
          loading="lazy"
        />
      );
    case "table":
      return (
        <div key={key} className="studioTableScroll">
          <table>
            <tbody>{children}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{children}</tr>;
    case "tableCell":
      return (
        <td
          key={key}
          colSpan={Number(n.attrs?.colspan ?? 1)}
          rowSpan={Number(n.attrs?.rowspan ?? 1)}
        >
          {children}
        </td>
      );
    case "tableHeader":
      return (
        <th
          key={key}
          colSpan={Number(n.attrs?.colspan ?? 1)}
          rowSpan={Number(n.attrs?.rowspan ?? 1)}
        >
          {children}
        </th>
      );
    default:
      return null;
  }
}
export function RichPreview({
  body,
  privateImages = false,
}: {
  body: RichNode;
  privateImages?: boolean;
}) {
  try {
    return (
      <div className="studioPreview">
        {render(validateBody(body), "preview", privateImages)}
      </div>
    );
  } catch {
    return <p role="alert">Chưa mở được nội dung bản nháp.</p>;
  }
}

/** Public snapshots only: never calls the authenticated draft/media reader. */
export function RichArticle({ body }: { body: RichNode }) {
  return <RichPreview body={body} privateImages={false} />;
}
