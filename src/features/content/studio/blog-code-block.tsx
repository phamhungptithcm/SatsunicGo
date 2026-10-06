import { BlogCopyButton } from "./blog-copy-button";
export function BlogCodeBlock({
  source,
  language,
}: {
  source: string;
  language?: string;
}) {
  return (
    <div className="blog-code-block">
      <div className="blog-code-tools">
        <span>{language || "Code"}</span>
        <BlogCopyButton text={source} />
      </div>
      <pre>
        <code>{source}</code>
      </pre>
    </div>
  );
}
