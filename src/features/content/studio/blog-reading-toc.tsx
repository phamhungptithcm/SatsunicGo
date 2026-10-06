"use client";
import { useEffect, useRef, useState } from "react";
import { activeReadingSection, type ReadingHeading } from "./reading-layout";
export function BlogReadingToc({
  headings,
  sources,
  discussion,
  vi,
}: {
  headings: ReadingHeading[];
  sources: boolean;
  discussion: boolean;
  vi: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const mobile = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const items = [
      ...headings.map((h) => h.id),
      ...(sources ? ["sources"] : []),
      ...(discussion ? ["comments"] : []),
    ];
    const elements = items
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive(
        activeReadingSection(
          elements.map((el) => ({
            id: el.id,
            top: el.getBoundingClientRect().top,
          })),
        ),
      );
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    queue();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    // Images and diagrams may change article geometry after hydration.
    const article = document.querySelector(".article-body");
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(queue);
    if (article) observer?.observe(article);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      observer?.disconnect();
    };
  }, [headings, sources, discussion]);
  if (!headings.length && !sources && !discussion) return null;
  const label = vi ? "Trong bài" : "In this post";
  const links = (
    <nav aria-label={vi ? "Mục lục bài viết" : "Article contents"}>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={active === h.id ? "current" : ""}
          aria-current={active === h.id ? "location" : undefined}
          data-level={h.level}
          onClick={() => {
            if (mobile.current) mobile.current.open = false;
          }}
        >
          {h.text}
        </a>
      ))}
      {sources && (
        <a
          href="#sources"
          className={active === "sources" ? "current" : ""}
          aria-current={active === "sources" ? "location" : undefined}
          onClick={() => {
            if (mobile.current) mobile.current.open = false;
          }}
        >
          {vi ? "Nguồn tham khảo" : "Sources"}
        </a>
      )}
      {discussion && (
        <a
          href="#comments"
          className={active === "comments" ? "current" : ""}
          aria-current={active === "comments" ? "location" : undefined}
          onClick={() => {
            if (mobile.current) mobile.current.open = false;
          }}
        >
          {vi ? "Bình luận" : "Discussion"}
        </a>
      )}
    </nav>
  );
  return (
    <>
      <aside className="toc reading-toc-desktop">
        <div className="eyebrow">{label}</div>
        {links}
      </aside>
      <details className="reading-toc-mobile" ref={mobile}>
        <summary>
          {label}
          <span aria-hidden="true">⌄</span>
        </summary>
        {links}
      </details>
    </>
  );
}
