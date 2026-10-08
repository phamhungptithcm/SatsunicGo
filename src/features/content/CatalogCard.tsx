import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
export function CatalogCard({
  id,
  slug,
  title,
  alt,
  priority,
  children,
}: {
  id?: string;
  slug: string;
  title: string;
  alt: string;
  priority: boolean;
  children: ReactNode;
}) {
  const [settled, setSettled] = useState(!id);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setSettled(!id);
    setFailed(false);
    if (!id) return;
    const timer = window.setTimeout(() => setSettled(true), 1800);
    return () => window.clearTimeout(timer);
  }, [id]);
  return (
    <article className={`productCard${settled ? "" : " productCardPending"}`}>
      <Link
        className="productImage"
        to={`/products/${slug}`}
        aria-label={`Xem ${title}`}
      >
        {id && !failed ? (
          <img
            src={`/media/${id}?w=640`}
            srcSet={[320, 640, 960]
              .map((w) => `/media/${id}?w=${w} ${w}w`)
              .join(", ")}
            sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
            width="640"
            height="640"
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setSettled(true)}
            onError={() => {
              setFailed(true);
              setSettled(true);
            }}
          />
        ) : (
          <span className="productMonogram" aria-hidden="true">
            ◇
          </span>
        )}
      </Link>
      <div className="catalogCardContent">{children}</div>
    </article>
  );
}
