# Ask scenario register · v2

98 scenarios, including seven additional review-driven recipient races/failures. 32 focused client cases PASSED against real Ask/hook + synthetic Auth/Firestore/API. 26 standalone preview checks PASSED. These are separate tiers; no all-flow provider/production completion claim.

| ID | Family | Scenario | Evidence status |
| --- | --- | --- | --- |
| A01 | Conversation and natural requests | VI accent/typo or informal request | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A02 | Conversation and natural requests | English request and language switch | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A03 | Conversation and natural requests | Question about sending vs actual send | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A04 | Conversation and natural requests | Quoted action or hypothetical yes | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A05 | Conversation and natural requests | Conditional yes requiring clarification | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A06 | Conversation and natural requests | Contradictory yes/no | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A07 | Conversation and natural requests | Approval plus field edit | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A08 | Conversation and natural requests | No current preview | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A09 | Conversation and natural requests | Two possible current actions | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| A10 | Conversation and natural requests | History selected then yes | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| B01 | Custom buying request | Valid one-item request | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| B02 | Custom buying request | 30-item valid long form | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| B03 | Custom buying request | Quantity0/101/noninteger | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| B04 | Custom buying request | Invalid http(s) link | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| B05 | Custom buying request | Unsupported market | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| B06 | Custom buying request | Visible unsaved manual edit then button | LOCAL_COMPONENT_PASSED |
| B07 | Custom buying request | Visible unsaved edit then exact chat | LOCAL_COMPONENT_PASSED |
| B08 | Custom buying request | Failed save preserves editor | LOCAL_COMPONENT_PASSED |
| B09 | Custom buying request | Unknown save avoids false success | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| B10 | Custom buying request | Server draft changed in another tab | LOCAL_COMPONENT_PASSED |
| B11 | Custom buying request | Non-draft turn save changes version | LOCAL_COMPONENT_PASSED |
| B12 | Custom buying request | Own verified save establishes base | LOCAL_COMPONENT_PASSED |
| C01 | Recipient and quote | Saved recipient loaded and verified | LOCAL_COMPONENT_PASSED |
| C02 | Recipient and quote | Unsaved address stays separate from saved | LOCAL_COMPONENT_PASSED |
| C03 | Recipient and quote | Unsaved edit blocks quote button | LOCAL_COMPONENT_PASSED |
| C04 | Recipient and quote | Unsaved edit blocks exact chat quote | LOCAL_COMPONENT_PASSED |
| C05 | Recipient and quote | Successful save closes same editor revision | LOCAL_COMPONENT_PASSED |
| C06 | Recipient and quote | Failed save stays editing | LOCAL_COMPONENT_PASSED |
| C07 | Recipient and quote | Delayed success cannot close over newer edit | LOCAL_COMPONENT_PASSED |
| C08 | Recipient and quote | Saved-recipient read unavailable | LOCAL_COMPONENT_PASSED |
| C09 | Recipient and quote | Quote expired | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| C10 | Recipient and quote | Quote reissued/order revision changed | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| C11 | Recipient and quote | Correct quote and deposit accepted once | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| C12 | Recipient and quote | Acceptance does not mark paid | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D01 | Catalog and web research | Published orderable variant at current price | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D02 | Catalog and web research | Unavailable catalog never looks like zero stock | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D03 | Catalog and web research | Catalog miss with explicit market starts allowed research | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D04 | Catalog and web research | Missing market asks follow-up | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D05 | Catalog and web research | Web suggestions and merchant references separated | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D06 | Catalog and web research | Research provider unavailable | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D07 | Catalog and web research | Expired reference cannot fill draft | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D08 | Catalog and web research | New reference clears old expired state | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D09 | Catalog and web research | No verified merchant review/price never fabricated | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D10 | Catalog and web research | Product/variant/source revision changed | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D11 | Catalog and web research | Selection quantity/variant edit invalidates review | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| D12 | Catalog and web research | Catalog checkout server-derived full total | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E01 | Payment order and recovery | Prepare checkout for authoritative amount | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E02 | Payment order and recovery | Payment page unavailable preserves unpaid status | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E03 | Payment order and recovery | Customer says paid without verification | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E04 | Payment order and recovery | Mismatched provider amount/reference rejected | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E05 | Payment order and recovery | Repeat command uses exact UUID | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E06 | Payment order and recovery | Lost response reconciles original operation | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E07 | Payment order and recovery | Changed replay envelope rejected | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E08 | Payment order and recovery | Pending unknown blocks task switch/new mutation | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E09 | Payment order and recovery | Partial receipt never completes all items | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| E10 | Payment order and recovery | Full receipt at authorized stage completes once | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F01 | Security and private data | Guest cannot submit private operation | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F02 | Security and private data | Unverified/non-Google account rejected | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F03 | Security and private data | Foreign UID/CID/order rejected | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F04 | Security and private data | Locked customer or disabled commerce rejected | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F05 | Security and private data | Auth switches before render callback | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F06 | Security and private data | Auth A to guest to A rejects stale callback | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F07 | Security and private data | Conversation/order version mismatch | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F08 | Security and private data | Private recipient never in LLM context/transcript | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F09 | Security and private data | Staff finance action forbidden to customer | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| F10 | Security and private data | Catalog/custom/membership meanings distinct | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G01 | Knowledge context and feedback | Bounded approved chunks with source revision | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G02 | Knowledge context and feedback | Unsupported policy answered as unavailable | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G03 | Knowledge context and feedback | Task/context stamp changed during answer | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G04 | Knowledge context and feedback | Forged/stale citation rejected | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G05 | Knowledge context and feedback | Context preserves active task and output reserve | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G06 | Knowledge context and feedback | Feedback without consent/policy rejected | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G07 | Knowledge context and feedback | Withdraw same UUID with unknown response | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G08 | Knowledge context and feedback | OWNER/MFA review required | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G09 | Knowledge context and feedback | Unreviewed feedback never auto-promoted | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| G10 | Knowledge context and feedback | Cleanup update-time precondition protects renewed data | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H01 | UI UX accessibility and performance | 320/390 contained form and fixed composer | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H02 | UI UX accessibility and performance | 768/1440 chat plus action arrangement | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H03 | UI UX accessibility and performance | Long form scroll leaves chat position unchanged | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H04 | UI UX accessibility and performance | Task switch retains draft under same owner | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H05 | UI UX accessibility and performance | Historical waypoint read-only and return-current | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H06 | UI UX accessibility and performance | Native invalid field receives focus | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H07 | UI UX accessibility and performance | Button transition focuses new heading | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H08 | UI UX accessibility and performance | IME Enter does not submit | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H09 | UI UX accessibility and performance | Shift Enter makes newline | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H10 | UI UX accessibility and performance | Escape closes action before outer dialog | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H11 | UI UX accessibility and performance | Reduced motion and interruption | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H12 | UI UX accessibility and performance | Loading/error/unknown states use concise VI/EN | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H13 | UI UX accessibility and performance | 24-turn30-item bounded local render profile | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H14 | UI UX accessibility and performance | 10 warm interactions p95 and long tasks | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| H15 | UI UX accessibility and performance | No duplicate dispatch/listener or retained DOM growth | NOT_RUN_AS_REGISTERED_END_TO_END_CASE |
| C13 | Recipient and quote | Save acknowledgement before delivery readback | LOCAL_COMPONENT_PASSED |
| C14 | Recipient and quote | Readback then error before acknowledgement | LOCAL_COMPONENT_PASSED |
| C15 | Recipient and quote | Second tab changes recipient before readback | LOCAL_COMPONENT_PASSED |
| C16 | Recipient and quote | Immediate stale quote handler | LOCAL_COMPONENT_PASSED |
| C17 | Recipient and quote | Immediate stale direct payment handler | LOCAL_COMPONENT_PASSED |
| C18 | Recipient and quote | Ended listener read-only retry | LOCAL_COMPONENT_PASSED |
| C19 | Recipient and quote | Missing/wrong-owner/schema-invalid recipient | LOCAL_COMPONENT_PASSED |

Exact given/when/then/oracle and current evidence are in SCENARIOS-r2.json. Financial/provider authorization, real web merchant verification, deployed identity/AppCheck and production remain separate gates.
