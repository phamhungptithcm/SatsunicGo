import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  realpath,
  mkdir,
  writeFile,
  unlink,
  rm,
} from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { once } from "node:events";
import type { FSWatcher } from "chokidar-core";

const require = createRequire(import.meta.url);
const firebase = createRequire(require.resolve("firebase-tools/package.json"));
const watcher: {
  watch: (path: string, options?: Record<string, unknown>) => FSWatcher;
} = firebase("chokidar");
const ftpRequire = createRequire(firebase.resolve("get-uri"));

async function until(predicate: () => boolean, diagnostic?: () => unknown) {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error(
        `Watcher did not emit the expected event: ${JSON.stringify(diagnostic?.())}`,
      );
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

describe("Firebase toolchain compatibility", () => {
  it("loads the pinned CLI and local compatibility adapter", () => {
    expect(firebase.resolve("chokidar")).toContain(
      "tools/firebase-watcher/index.cjs",
    );
    expect(
      execFileSync(
        process.execPath,
        [firebase.resolve("./lib/bin/firebase.js"), "--version"],
        {
          timeout: 15000,
          env: {
            ...process.env,
            CI: "true",
            FIREBASE_CLI_DISABLE_UPDATE_CHECK: "true",
          },
          encoding: "utf8",
        },
      ).trim(),
    ).toBe("15.32.1");
  }, 20000);

  it("preserves ready, hot reload, add, unlink, ignore and close", async () => {
    const root = await realpath(
      await mkdtemp(join(tmpdir(), "firebase-watcher-")),
    );
    // Subscribe to an existing file before testing change: add/change on a
    // newly discovered file can be coalesced by the native filesystem watcher.
    const hotFile = join(root, "hot.js");
    await writeFile(hotFile, "initial");
    const seen: string[] = [];
    const errors: unknown[] = [];
    let closed = false;
    const instance = watcher.watch(root, {
      ignoreInitial: true,
      ignored: [
        /(^|[/\\])\../,
        /.+\.log/,
        /.+?[/\\]node_modules[/\\].+?/,
        "**/generated/**",
      ],
    });
    instance.on("all", (event, path) => seen.push(`${event}:${path}`));
    instance.on("error", (error) => errors.push(error));
    try {
      await once(instance, "ready", { signal: AbortSignal.timeout(5000) });
      const addedDirectory = join(root, "nested");
      await mkdir(addedDirectory);
      const file = join(addedDirectory, "index.js");
      await writeFile(file, "one");
      await until(
        () =>
          seen.includes(`add:${file}`) &&
          seen.includes(`addDir:${addedDirectory}`),
        () => ({
          expected: ["add", "addDir"],
          seen,
          errors: errors.map(String),
          watched: instance.getWatched(),
        }),
      );
      await writeFile(hotFile, "updated hot reload");
      await until(() => seen.includes(`change:${hotFile}`));
      await unlink(file);
      await until(() => seen.includes(`unlink:${file}`));
      for (const folder of [".hidden", "generated", "node_modules/pkg"]) {
        await mkdir(join(root, folder), { recursive: true });
        await writeFile(join(root, folder, "ignored.js"), "ignored");
      }
      await writeFile(join(root, "ignored.log"), "ignored");
      // A later visible event provides a positive control after ignored mutations.
      const marker = join(root, "visible.js");
      await writeFile(marker, "visible");
      await until(() => seen.includes(`add:${marker}`));
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(seen.some((event) => /ignored\.(js|log)$/.test(event))).toBe(
        false,
      );
      expect(errors).toEqual([]);
      await instance.close();
      closed = true;
      const count = seen.length;
      await writeFile(join(root, "after-close.js"), "closed");
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(seen).toHaveLength(count);
    } finally {
      if (!closed) await instance.close();
      await rm(root, { recursive: true, force: true });
    }
  }, 15000);

  it.each([
    {
      ignored: (path: string) => path.endsWith("skip.js"),
      blocked: "skip.js",
      allowed: "keep.js",
    },
    {
      ignored: ["**/*.tmp", "!**/keep.tmp"],
      blocked: "skip.tmp",
      allowed: "keep.tmp",
    },
  ])(
    "retains function and negated glob ignore semantics: $blocked",
    async ({ ignored, blocked, allowed }) => {
      const root = await mkdtemp(join(tmpdir(), "firebase-ignore-"));
      const seen: string[] = [];
      const instance = watcher.watch(root, { ignored, ignoreInitial: true });
      instance.on("add", (path) => seen.push(path));
      try {
        await once(instance, "ready", { signal: AbortSignal.timeout(5000) });
        await writeFile(join(root, blocked), "blocked");
        await writeFile(join(root, allowed), "allowed");
        await until(() => seen.includes(join(root, allowed)));
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(seen).not.toContain(join(root, blocked));
      } finally {
        await instance.close();
        await rm(root, { recursive: true, force: true });
      }
    },
  );

  it("keeps the FTP client contract consumed by get-uri", () => {
    const { Client, FTPError } = ftpRequire("basic-ftp");
    const client = new Client();
    try {
      for (const method of [
        "access",
        "lastMod",
        "list",
        "downloadTo",
        "close",
      ]) {
        expect(typeof client[method]).toBe("function");
      }
      expect(new FTPError({ code: 550, message: "Unavailable" }).code).toBe(
        550,
      );
      const { parseLine } = ftpRequire("basic-ftp/dist/parseListUnix.js");
      const entry = parseLine(
        "-rw-r--r-- 1 owner group 123 Jan 10 2026 invoice.txt",
      );
      expect(entry).toMatchObject({ name: "invoice.txt", size: 123 });
      const { parseList } = ftpRequire("basic-ftp/dist/parseList.js");
      const mlsd = parseList(
        "type=file;size=123;modify=20260110120000; invoice.txt",
      );
      expect(mlsd[0].modifiedAt).toEqual(new Date("2026-01-10T12:00:00Z"));
    } finally {
      client.close();
    }
  });

  it("bounds malicious FTP listing parsing in a separate process", () => {
    const parser = ftpRequire.resolve("basic-ftp/dist/parseListUnix.js");
    execFileSync(
      process.execPath,
      [
        "-e",
        `const {parseLine}=require(${JSON.stringify(parser)});for(let i=0;i<10;i++)parseLine('-rw-r--r-- 1 '+ 'x '.repeat(50000)+'!');`,
      ],
      { timeout: 3000 },
    );
    const metadata = JSON.parse(
      readFileSync(
        join(dirname(ftpRequire.resolve("basic-ftp")), "../package.json"),
        "utf8",
      ),
    );
    expect(metadata.version).toBe("6.2.3");
  });
});
