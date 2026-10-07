import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import {
  bannerMode,
  bannerId,
  bannerDraftSchema,
} from "../../../packages/domain/campaign-banners";
import "./campaign-banner.css";
const imagePath = z
  .string()
  .regex(/^\/campaign-banners\/media\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/);
export const publicBannerResponse = z
  .object({
    serverNow: z.number().int().positive(),
    mode: bannerMode,
    entries: z
      .array(
        z
          .object({
            id: bannerId,
            revision: z.number().int().positive(),
            title: z.string().min(2).max(80),
            description: z.string().max(160),
            cta: z.string().min(2).max(40),
            path: bannerDraftSchema.shape.path,
            endsAt: z.number().int().positive(),
            desktopImage: imagePath,
            desktopAlt: z.string().min(2).max(300),
            mobileImage: imagePath.optional(),
            mobileAlt: z.string().min(2).max(300).optional(),
          })
          .strict(),
      )
      .max(12),
  })
  .strict();
type Response = z.infer<typeof publicBannerResponse>;
export function CampaignBanner({
  placement,
}: {
  placement: "home" | "products";
}) {
  const [data, setData] = useState<{
      value: Response;
      received: number;
      wall: number;
    } | null>(null),
    [, setTick] = useState(0),
    [index, setIndex] = useState(0),
    [failed, setFailed] = useState<string[]>([]);
  const touch = useRef<number | null>(null);
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 600px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    let alive = true,
      revision = 0,
      controller: AbortController | undefined;
    async function refresh() {
      const current = ++revision;
      controller?.abort();
      controller = new AbortController();
      const requestController = controller;
      const timeout = window.setTimeout(() => requestController.abort(), 8000);
      try {
        const response = await fetch(
          `/campaign-banners?placement=${placement}`,
          {
            cache: "no-store",
            signal: requestController.signal,
            credentials: "omit",
          },
        );
        if (!response.ok) throw new Error("unavailable");
        const value = publicBannerResponse.parse(await response.json());
        if (alive && current === revision) {
          setData({ value, received: performance.now(), wall: Date.now() });
        }
      } catch {
        if (alive && current === revision) setData(null);
      } finally {
        clearTimeout(timeout);
      }
    }
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    const clock = setInterval(() => setTick((v) => v + 1), 1000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      alive = false;
      revision++;
      controller?.abort();
      clearInterval(poll);
      clearInterval(clock);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [placement]);
  // A suspended tab must not retain a stale promotion. Server time, elapsed monotonic time.
  const elapsed = data
    ? Math.max(0, performance.now() - data.received, Date.now() - data.wall)
    : Infinity;
  const now = data ? data.value.serverNow + elapsed : Infinity;
  const rows =
    data && elapsed < 45000
      ? data.value.entries.filter(
          (e) => e.endsAt > now && !failed.includes(`${e.id}:${e.revision}`),
        )
      : [];
  if (!rows.length) return null;
  const slider = data?.value.mode !== "static" && rows.length > 1,
    current = Math.min(index, rows.length - 1),
    row = rows[slider ? current : 0];
  const move = (delta: number) =>
    setIndex((current + delta + rows.length) % rows.length);
  return (
    <section
      className={`sgBanner sgBanner--${placement}`}
      aria-label="Chương trình đang diễn ra"
      aria-roledescription={slider ? "trình chiếu" : undefined}
      onKeyDown={(e) => {
        if (slider && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
          e.preventDefault();
          move(e.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div
        className="sgBannerPanel"
        onTouchStart={(e) => {
          touch.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchEnd={(e) => {
          const x = e.changedTouches[0]?.clientX;
          if (
            slider &&
            touch.current !== null &&
            x !== undefined &&
            Math.abs(x - touch.current) > 60
          ) {
            e.preventDefault();
            move(x < touch.current ? 1 : -1);
          }
          touch.current = null;
        }}
      >
        <div className="sgBannerCopy">
          <span className="sgBannerEyebrow">Đang diễn ra</span>
          <h2>{row.title}</h2>
          {row.description && <p>{row.description}</p>}
          <Link to={row.path} className="sgBannerCta">
            {row.cta}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <picture className="sgBannerImage">
          {row.mobileImage && (
            <source media="(max-width: 600px)" srcSet={row.mobileImage} />
          )}
          <img
            src={row.desktopImage}
            alt={
              mobile && row.mobileImage
                ? (row.mobileAlt ?? row.desktopAlt)
                : row.desktopAlt
            }
            width="720"
            height="480"
            loading="lazy"
            decoding="async"
            onError={() =>
              setFailed((previous) => [
                ...previous,
                `${row.id}:${row.revision}`,
              ])
            }
          />
        </picture>
      </div>
      {slider && (
        <div className="sgBannerControls">
          <span aria-live="polite" aria-atomic="true">
            {current + 1} / {rows.length}
          </span>
          <button
            type="button"
            aria-label="Chương trình trước"
            onClick={() => move(-1)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Chương trình tiếp theo"
            onClick={() => move(1)}
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}
