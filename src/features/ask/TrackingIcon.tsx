export function TrackingIcon({
  kind,
}: {
  kind: "check" | "box" | "truck" | "home" | "clock";
}) {
  const paths = {
    check: "m5 12 4 4 10-10",
    box: "m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7 5l10 5",
    truck:
      "M3 5h11v12H3V5Zm11 5h4l3 4v3h-7M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm11 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
    home: "m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8",
    clock: "M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
