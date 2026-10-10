"use strict";
const core = require("chokidar-core");
const anymatch = require("anymatch");
// Firebase 15 watches literal paths. Preserve its chokidar 3 ignore semantics
// because chokidar 4 treats ignored strings as exact paths, rather than globs.
function watch(paths, options = {}) {
  const matches = options.ignored == null ? null : anymatch(options.ignored);
  return core.watch(paths, {
    ...options,
    ...(matches ? { ignored: (path, stats) => matches([path, stats]) } : {}),
  });
}
module.exports = { ...core, watch };
