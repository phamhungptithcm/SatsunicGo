import { open, rename, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";

/** Local probe only. Caller holds its exclusive budget lock. A crash never
 * leaves a truncated accepted ledger; durable directory entry precedes dispatch.
 */
export async function writeResearchBudget(file: URL, ledger: unknown) {
  const body = JSON.stringify(ledger) + "\n";
  if (Buffer.byteLength(body, "utf8") > 8192)
    throw Error("RESEARCH_LEDGER_TOO_LARGE");
  const temporary = new URL(
    `${file.pathname.split("/").at(-1)}.${randomUUID()}.tmp`,
    file,
  );
  const handle = await open(temporary, "wx", 0o600);
  try {
    try {
      await handle.writeFile(body);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporary, file);
    const directory = await open(new URL(".", file), "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } finally {
    await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
