# Scoped quality gates

Stack: TypeScript 6, React 19, Firebase web 12/Admin 14/Functions v2 Node22, Vite8, Vitest4, ESLint9, Prettier3; execution host Node25. Profiles: universal, typescript-javascript, frontend-html-css, web-app, visual-design, product-content, animation-motion; database/API/security/concurrency compatibility reviewed for existing unchanged contracts.

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped frontend compilation | PASSED | isolated candidate npm build exit0; latest shared full check blocked by unrelated campaign test WIP |
| Frontend bundle | PASSED | FRONTEND_BUILD.log; scoped manifest |
| Backend compilation | PASSED | functions build exit0; source unchanged |
| Unit | PASSED | 43/43 |
| Emulator integration/security | PASSED | 47/47 random demo project; no shared restart |
| Static analysis/format | PASSED | targeted ESLint, Prettier and diff-check exit0 |
| API/DB/architecture compatibility | PASSED | tariff/backend schema unchanged; existing openTicket contract reused |
| Migration | NOT_APPLICABLE | no database/schema migration |
| Product content | PASSED | CONTENT_REVIEW.md, rendered screenshots/accessibility semantics |
| Motion | PASSED | 180ms feedback/240ms tab, explicit properties, reduced motion; CSS cleanup no timers/listeners |
| Browser layout and recovery | PASSED | component30/app16 plus 200% zoom; fixture evidence |
| Auth/MFA/App Check | PASSED for source/emulator branches | unchanged backend guards; provider enforcement live NOT_TESTED |
| SEO/GEO | NOT_APPLICABLE | navigation/metadata/crawler/discovery contract unchanged; no commercial freshness claim added |
| Observability | PASSED review | raw technical messages no longer displayed; backend logging unchanged because no evidenced code defect |
| Real provider availability | BLOCKED | PROVIDER_READBACK.json: callable404/list empty |
| Physical device / screen-reader speech | NOT_RUN | browser native/accessibility semantics checked; manual provider/device certification not claimed |
| Isolated release candidate | PASSED | ISOLATED_CANDIDATE_BUILD.log; HEAD archive plus approved3 files |
| Final implementation review | BLOCKED online | newest review and report; live restoration needs release approval |

Source freeze is scoped to IMPLEMENTATION_SOURCE_MANIFEST.json; unrelated shared WIP excluded from release candidate.
