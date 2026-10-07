# Review and fix ledger
Historical receipts recorded now without backdating runtime transitions.

1. Author hardening: timeout/expiry races, static raster decode, strict hide/UUID/date grammar, post-download public rights check, bounded concurrency, mobile alt and upload session fence fixed. Initial fixture/compiler failures retained in private logs; recursive Ref and Firebase Request types fixed, not assertions weakened.
2. Independent cycle1 BLOCKED: M1 command ACK/reload generation left busy stuck; M2 canonical route/preflight validation missing; M3 preview media rights/binding changed during decode. Fixes: separate session/command and listing generations, strict canonical routing, post-decode fresh metadata/auth.
3. Independent cycle2 BLOCKED: M1/M3 closed; legacy robots-denial test removed banner route by positional splice after new routes. Explicit robots route filter restores original negative oracle.
4. Independent cycle3 scoped PASS: M1/M2/M3 closed. App base drift source-reviewed separately; rebase preserved unrelated Account icon removals.
5. Integrated independent cycle4 scoped PASS: exact 8 owned v10 + 7 shared source hashes matched; captured checks reviewed independently, reviewer did not rerun tests. No current actionable medium/high source defects. Local render/integration proof only; production NOT_READY.

Residual: private admin/preview default 60s read deadline; real mobile-preview stale-removal branch and last-read-to-client race not fully certified. Full live auth/storage/Hosting/SDK concurrency, IME/AT/hardware and cloud rollback NOT_RUN. No claim of perfection.
