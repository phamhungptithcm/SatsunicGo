# Approved bounded correction: artifact-triggered dev reload

Root owns vite.config.ts. User explicitly approved all proposed local fixes and test/fix/verify loops. Current trace and owned Vite output show repeated page reloads caused by Playwright trace resource HTML and result metadata inside output/playwright. Full browser cycle6 was33pass/1fail; diagnostic itself reloaded continually. No auth or document success inferred from that failure.

Add a Vite development watcher exclusion for generated test output and playwright-report only. Preserve source watching, build, domain, authorization, database and deployment behavior. Risk low: artifact changes no longer trigger development reload. Verify failed document scenario with trace enabled and full browser suite, typecheck/lint/build. No production change or financial mutation.
