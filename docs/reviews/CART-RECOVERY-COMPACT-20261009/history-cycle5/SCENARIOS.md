# Cart recovery scenarios — current evidence

Evidence is local/emulator only. Browser component proxies and actual browser interactions are distinguished. No order, payment, production mutation or provider settlement was performed.

| Realistic scenario | Expected result | Current evidence/status |
| --- | --- | --- |
| Customer opens cart after login with previously selected products | Transfer automatically, preserve variants and existing account quantities | Unit + real verified Google Auth Emulator/cartCommand HTTP PASSED; native browser login transition NOT_RUN |
| Three tabs open the same guest choices together | One extra server operation, no doubled quantities | Coordinator unit + real HTTP PASSED; lock adapter simulates tabs, not native browser tabs |
| Server commits but response is lost | Exact owner/operation/payload replay, current cart read, no doubled quantity | Unit + real HTTP PASSED |
| Account cart revision advances before retry | Replay prior committed operation safely | Unit + HTTP PASSED |
| Durable local journal cannot be written | Do not send remotely; preserve choice | Unit PASSED |
| Remote commit succeeds, local reconciliation write fails | Keep exact journal/source; retry same operation | Unit PASSED |
| Journal removal fails; customer later adds same product | Tombstone prevents subtracting later addition twice | Unit PASSED |
| Account changes during request | Do not apply response or clear choices for new account | Unit active-session callback PASSED; store UID/generation guards reviewed; native switch NOT_RUN |
| Different account sees an old uncertain journal | Do not transfer the old command to the new account | Unit PASSED |
| Quantity changes in another tab during transfer | Consume only matching submitted quantity/line identity; retain later choice | Unit PASSED |
| Unrelated account add occurs with guest recovery markers | No mutation/aging of unrelated guest markers | Unit PASSED |
| Product removed or inaccessible | Retain local row, reject server merge, allow local removal, do not invent price | Real HTTP + native shared cart retry320/390/desktop PASSED |
| One missing product mixed with available product | Keep available product current; isolate unreadable row | Real candidate public SDK3cases + unit PASSED |
| Network fails during isolated product reads | All current-price assurance remains unverified; review blocked | Unit PASSED |
| Guest variant no longer sold | Reject merge, preserve chosen row | Real HTTP PASSED |
| Existing account quantity plus guest quantity exceeds100 | Reject without losing guest choice or changing account cart | Real HTTP PASSED |
| Storage is malformed, injected, or exceeds item bound | Reject before remote call | Unit PASSED |
| Browser lacks Web Locks | No automatic unsafe transfer; compact explanation | Source reviewed; native unsupported-browser NOT_RUN |
| Active checkout already exists | Defer fresh transfer; existing payment route/amount unchanged | Coordinator + rendered component PASSED; no payment write |
| Customer edits a guest row during uncertain transfer | Refuse edit until prior save checked; no silent loss | Store guards reviewed; local row native controls inspected; full native edit NOT_RUN to preserve existing data |
| Customer clears unreadable storage while transfer uncertain | Refuse journal-discarding reset | Source reviewed; unit coordinator retention cases PASSED |
| Empty cart or custom-only cart | Do not issue product-price queries or show price failure | Unit + component PASSED |
| Offline cart with stale previews | Show informative stale price, never0for unknown; block review | Unit + component PASSED |
| Price read recovers | Fresh server values replace stale preview and clear failure | Unit PASSED |
| Concurrent equal price reads | Share in-flight request; finally removes flight | Unit PASSED |
| Both30-line carts visible before transfer | At most2normal30-ID batches; bounded fallback | Unit PASSED; no production load/latency claim |
| Forged owner/price, unauthenticated or locked account | Unchanged server validation rejects write | Real HTTP PASSED |
| Cart service opts into inline feedback | No duplicate global toast/overlay; mutation timeout and errors preserved | Unit + actual native rejected retry PASSED |
| Another service uses existing two-argument call | Global feedback, timeout, payload clone unchanged | Unit PASSED |
| Recent MFA required | Only retry after actual recovery; account/path changes cancel replay | Actual recovery module with mocked SDK unit PASSED; production MFA NOT_RUN |
| Narrow width320/390 and desktop | No legacy blue banners/overflow; review disabled for unresolved choice | Native shared cart PASSED |
| Expanded error text200% at320 | Readable wrapping, retry visible, review disabled | Current rendered-component proxy PASSED; OS zoom NOT_RUN |
| Existing human/demo cart during testing | No logout/cart removal/reset; fixtures only cleaned | Cleanup PASSED; no unrelated account touched |

The remaining acceptance blocker is the native clean-browser anonymous → login → auto-transfer → reload/multiple-tab sequence at the approved runtime. Both current browser sessions are already signed in; changing them was intentionally avoided. HTTP evidence proves server/coordinator behavior, not browser authentication wiring.
