import { externalLinkProps } from "./source-external-link";
import { imageDimension } from "./editor-image";
import { BlogCodeBlock } from "./blog-code-block";
import { BlogHeading } from "./blog-heading";
const codeSource = (node: RichNode) =>
  (node.content ?? []).map((child) => child.text ?? "").join("");
import { isMermaidBlock } from "./mermaid-source";
import { readingHeadings } from "./reading-layout";
import { BlogReadingToc } from "./blog-reading-toc";
import { BlogImageViewer } from "./blog-image-viewer";
import { MermaidDiagram } from "./source-mermaid";
import type { ReactNode } from "react";
import type {
  RichNode,
  StudioPost,
} from "../../../../packages/domain/blog-studio";
type PublishedPost = StudioPost & {
  publishedAt: string;
  author: string;
  authorAvatarId?: string;
  authorGoogleAvatar?: string;
  authorBio?: string;
  readingMinutes: number;
};
import { safeUrl } from "../../../../packages/domain/blog-studio";
import { SourceLink as Link } from "./source-link";
import { useNavigate } from "react-router-dom";
import { Avatar, Cover } from "./source-ui";
function render(n: RichNode, key: string): ReactNode {
  const children = n.content?.map((c, i) => render(c, `${key}-${i}`));
  switch (n.type) {
    case "doc":
      return children;
    case "text": {
      let text: ReactNode = n.text;
      for (const m of n.marks ?? []) {
        if (m.type === "bold") text = <strong>{text}</strong>;
        if (m.type === "italic") text = <em>{text}</em>;
        if (m.type === "strike") text = <s>{text}</s>;
        if (m.type === "code") text = <code>{text}</code>;
        if (m.type === "underline") text = <u>{text}</u>;
        if (m.type === "link" && safeUrl(String(m.attrs?.href)))
          text = (
            <a
              href={String(m.attrs?.href)}
              {...externalLinkProps(String(m.attrs?.href))}
            >
              {text}
            </a>
          );
      }
      return <span key={key}>{text}</span>;
    }
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading":
      return (
        <BlogHeading
          id={`section-${key}`}
          key={key}
          level={n.attrs?.level === 3 ? 3 : n.attrs?.level === 4 ? 4 : 2}
        >
          {children}
        </BlogHeading>
      );
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock":
      if (
        isMermaidBlock(
          n.attrs?.language,
          (n.content ?? []).map((c) => c.text ?? "").join(""),
        )
      )
        return (
          <MermaidDiagram
            key={key}
            source={(n.content ?? []).map((c) => c.text ?? "").join("")}
            enlarge
          />
        );
      return (
        <BlogCodeBlock
          key={key}
          source={codeSource(n)}
          language={
            typeof n.attrs?.language === "string" ? n.attrs.language : undefined
          }
        />
      );
    case "table":
      return (
        <div className="blog-table-scroll" key={key}>
          <table>
            <tbody>{children}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{children}</tr>;
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
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return (
        <figure
          key={key}
          className="article-image"
          style={
            imageDimension(n.attrs?.width)
              ? {
                  width: imageDimension(n.attrs?.width)!,
                  maxWidth: "100%",
                  marginLeft: "auto",
                  marginRight: "auto",
                }
              : undefined
          }
        >
          {/* Auth-checked media cannot use a public optimization cache. */}
          <BlogImageViewer
            vi={false}
            src={String(n.attrs?.src)}
            alt={String(n.attrs?.alt ?? "")}
            loading="lazy"
          />
          {n.attrs?.title ? (
            <figcaption>{String(n.attrs.title)}</figcaption>
          ) : null}
        </figure>
      );
    default:
      return null;
  }
}
export function BlogContent({
  post,
}: {
  post: PublishedPost;
  url?: string;
  preview?: boolean;
  series?: ReactNode;
}) {
  const preview = true;
  const navigate = useNavigate();
  const copy = (vi: string, en: string) => (preview ? vi : en);
  const date = (v: string) =>
    new Intl.DateTimeFormat(preview ? post.language : "en", {
      dateStyle: "long",
    }).format(new Date(v));
  const headings = readingHeadings(post.body);
  return (
    <div className="container" lang={preview ? post.language : "en"}>
      <header className="article-heading">
        <div className="breadcrumbs">
          <Link navigate={navigate} href="/posts">
            Journal
          </Link>
          <span>/</span>
          <Link
            navigate={navigate}
            href={`/posts?category=${encodeURIComponent(post.category)}`}
          >
            {post.category}
          </Link>
          <span>/</span>
          <span>
            {copy("Góc nhìn từ HunpeoLabs", "Perspectives from Hunpeo Labs")}
          </span>
        </div>
        <div className="eyebrow tiny-rule">{post.category} · Field notes</div>
        <h1>{post.title}</h1>
        <p className="article-deck">{post.summary}</p>
        <div className="article-meta">
          <div className="byline">
            <Avatar
              name={post.author}
              mediaId={post.authorAvatarId}
              photo={post.authorGoogleAvatar}
              className="dark big"
            />
            <span>
              <strong style={{ color: "var(--ink)", fontWeight: 550 }}>
                {post.author}
              </strong>
              <br />
              <span className="small">
                {date(post.publishedAt)} · {post.readingMinutes}{" "}
                {copy("phút đọc", "min read")}
              </span>
              {post.updatedAt !== post.publishedAt && (
                <span className="small" style={{ display: "block" }}>
                  {copy("Cập nhật", "Updated")} {date(post.updatedAt)}
                </span>
              )}
            </span>
          </div>
        </div>
      </header>

      <div className="reading-cover">
        <Cover
          language={preview ? "vi" : "en"}
          id={post.coverId}
          title={post.title}
          loading="eager"
        />
      </div>
      <div className="caption">
        {post.category} · {post.author}
      </div>
      <div className="reading-layout">
        <BlogReadingToc
          headings={headings}
          sources={post.sources.length > 0}
          discussion={!preview}
          vi={preview}
        />
        <article className="article-body">
          {post.answer && (
            <div className="insight">
              <div className="eyebrow">{copy("Ý chính", "Key takeaways")}</div>
              {post.answer}
            </div>
          )}
          <div className="article-prose" lang={post.language}>
            {render(post.body, "0")}
          </div>
          {post.answer && (
            <section className="insight" aria-label="In closing">
              <h2>{copy("Điều nên nhớ", "In closing")}</h2>
              <p>{post.answer}</p>
            </section>
          )}
          <section id="sources">
            <h2>{copy("Nguồn tham khảo", "Sources")}</h2>
            <ol>
              {post.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} {...externalLinkProps(s.url)}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </section>
          <div className="article-end">
            <div className="flex" style={{ flexWrap: "wrap" }}>
              {post.tags.map((t) => (
                <Link
                  navigate={navigate}
                  className="badge"
                  key={t}
                  href={`/posts?tag=${encodeURIComponent(t)}`}
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
          <div className="author-card">
            <Avatar
              name={post.author}
              mediaId={post.authorAvatarId}
              photo={post.authorGoogleAvatar}
              className="big dark"
            />
            <div>
              <div className="eyebrow muted" style={{ fontSize: 9 }}>
                {copy("Người viết", "Author")}
              </div>
              <h3>{post.author}</h3>
              <p>
                {post.authorBio ||
                  copy(
                    "Góc nhìn được chia sẻ trên HunpeoLabs Journal.",
                    "Writing from Hunpeo Labs Journal.",
                  )}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
