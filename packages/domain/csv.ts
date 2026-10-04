import { itemSchema } from "./index";
export function importItemsCsv(text: string) {
  if (text.length > 50000) throw Error("CSV_TOO_LARGE");
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (!value || quoted) quoted = !quoted;
      else throw Error("INVALID_CSV");
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(value.replace(/\r$/, ""));
      value = "";
      if (c === "\n") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else value += c;
  }
  if (quoted) throw Error("INVALID_CSV");
  row.push(value.replace(/\r$/, ""));
  if (row.some(Boolean)) rows.push(row);
  if (
    rows.length < 2 ||
    rows.length > 31 ||
    rows[0].join(",") !== "name,url,quantity,variant"
  )
    throw Error("INVALID_COLUMNS");
  return rows.slice(1).map((r) => {
    if (r.length !== 4) throw Error("INVALID_ROW");
    return itemSchema.parse({
      name: r[0],
      url: r[1],
      quantity: Number(r[2]),
      variant: r[3],
    });
  });
}
