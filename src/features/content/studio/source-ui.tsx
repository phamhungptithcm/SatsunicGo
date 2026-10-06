import { useEffect, useState } from "react";
import { auth } from "../../../shared/firebase";
import { privateStudioImage } from "./media";
import { googleAvatar } from "./source-adapter";
const icons: Record<string, string> = {
  arrow: "M4 12h15M13 5l7 7-7 7",
  back: "M20 12H5m6-7-7 7 7 7",
  down: "m6 9 6 6 6-6",
  search: "m20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  plus: "M12 4v16M4 12h16",
  check: "m5 12 4 4L19 6",
  link: "m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5m11 1 2-2a4 4 0 0 0-6-6L7 5",
  copy: "M8 8h12v12H8zM16 4H4v12",
  share: "M12 15V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2",
  comment: "M21 4H3v13h5v4l5-4h8z",
  file: "M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h6",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7h-7zM14 14h7v7h-7z",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m12 10v-2a4 4 0 0 0-3-4m0-12a4 4 0 0 1 0 8",
  external: "M14 3h7v7m0-7L10 14M9 3H3v18h18v-6",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  image: "M3 3h18v18H3zm0 14 5-5 4 4 4-6 5 7M8 7h.01",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  folder: "M3 6V3h6l3 3h9v15H3z",
  rss: "M4 4c9 0 16 7 16 16M4 11a9 9 0 0 1 9 9M4 19h.01",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6zM8 12l3 3 5-6",
  mail: "M3 5h18v14H3zm0 0 9 8 9-8",
  close: "m6 6 12 12M6 18 18 6",
  bold: "M6 3h7a5 5 0 0 1 0 10H6zm0 10h8a4 4 0 0 1 0 8H6z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  code: "m8 5-7 7 7 7m8-14 7 7-7 7",
  quote: "M4 5h6v7H5c0 4 2 5 4 6M14 5h6v7h-5c0 4 2 5 4 6",
  history: "M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v6l3 2",
  warning: "M12 3 1 21h22zM12 9v5m0 3h.01",
};
export function BlogIcon({ name, size = 17 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icons[name] || icons.file} />
    </svg>
  );
}
export function BlogArt({ language = "vi" }: { language?: "vi" | "en" }) {
  return (
    <svg
      className="art"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 620 430"
      role="img"
      aria-label={
        language === "en"
          ? "Blue lines converging into a system"
          : "Minh họa các đường xanh hội tụ thành một hệ thống"
      }
    >
      <rect width="620" height="430" fill="#e9edde" />
      <g opacity=".5" stroke="#cad2be" strokeWidth=".6">
        <path d="M0 107H620M0 215H620M0 323H620M155 0V430M310 0V430M465 0V430" />
      </g>
      <circle cx="312" cy="217" r="155" fill="none" stroke="#ccd3bd" />
      <circle cx="312" cy="217" r="115" fill="none" stroke="#ccd3bd" />
      <g transform="rotate(13 310 215)">
        {Array.from({ length: 23 }, (_, i) => {
          const x = 148 + i * 8;
          return (
            <path
              key={i}
              d={`M${x} 324 C${x - 36} 220 ${345 + i * 3} 245 ${340 + i * 3} 103`}
              fill="none"
              stroke="#2449df"
              strokeWidth="2.2"
            />
          );
        })}
      </g>
      <g
        fontFamily="Arial,sans-serif"
        fontSize="9"
        fill="#57705a"
        letterSpacing="1.6"
      >
        <text x="29" y="35">
          HUNPEOLABS / FIELD NOTES
        </text>
        <text x="29" y="401">
          HUMAN × SYSTEM
        </text>
        <text x="528" y="401">
          JOURNAL
        </text>
      </g>
      <circle cx="147" cy="108" r="4" fill="#173df5" />
      <circle cx="465" cy="321" r="4" fill="#173df5" />
    </svg>
  );
}
export function Cover({
  id,
  title = "",
  loading = "lazy",
  language = "vi",
}: {
  id?: string;
  title?: string;
  loading?: "lazy" | "eager";
  language?: "vi" | "en";
}) {
  const mediaUrl = useStudioMedia(id);
  return id && mediaUrl ? (
    <img className="art" src={mediaUrl} alt={title} loading={loading} />
  ) : (
    <BlogArt language={language} />
  );
}
export const stateNames: Record<string, string> = {
  draft: "Bản nháp",
  review: "Chờ duyệt",
  published: "Đã xuất bản",
  archived: "Thùng rác",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  hidden: "Đã ẩn",
  deleted: "Đã xóa",
};
export function StatusBadge({
  state,
  language = "vi",
}: {
  state: string;
  language?: "vi" | "en";
}) {
  const english: Record<string, string> = {
    draft: "Draft",
    review: "Pending review",
    published: "Published",
    archived: "Trash",
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    hidden: "Hidden",
    deleted: "Deleted",
  };
  return (
    <span
      className={`badge ${["published", "approved"].includes(state) ? "green" : ["pending", "review"].includes(state) ? "amber" : ""}`}
    >
      <span className="dot" />
      {(language === "en" ? english[state] : stateNames[state]) || state}
    </span>
  );
}

export function useStudioMedia(id?: string) {
  const [url, setUrl] = useState<string>();
  const uid = auth?.currentUser?.uid;
  useEffect(() => {
    let live = true;
    let objectUrl: string | undefined;
    setUrl(undefined);
    if (id && uid)
      void privateStudioImage(id, uid)
        .then((value) => {
          objectUrl = value;
          if (live && auth?.currentUser?.uid === uid) setUrl(value);
          else URL.revokeObjectURL(value);
        })
        .catch(() => {});
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, uid]);
  return auth?.currentUser?.uid === uid ? url : undefined;
}
export function Avatar({
  name,
  className = "",
  mediaId,
  photo,
}: {
  name: string;
  className?: string;
  mediaId?: string;
  photo?: string;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const privateSrc = useStudioMedia(mediaId);
  const src = [privateSrc, googleAvatar(photo)].find(
    (url) => url && !failed.includes(url),
  );
  return src ? (
    <img
      className={`avatar ${className}`}
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed((previous) => [...previous, src])}
    />
  ) : (
    <span className={`avatar ${className}`} aria-hidden="true">
      {name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "•"}
    </span>
  );
}
