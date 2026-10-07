# BANNER076 execution matrix (authored; no execution claims)

| Gate | Happy | Bad / hardest boundary | Required evidence |
|---|---|---|---|
| Public landing | zero records -> hero flows directly to market; one -> static; multi auto -> manual | endpoint503, invalid JSON, 8s timeout, aborted focus refresh, image404, publication removed | actual React + native screenshot/console/network |
| Viewports | home and Products 195/390/768/1440 CSS widths | 200% zoom, 80-char title,160-char copy,40-char CTA, full Vietnamese diacritics | no document/element overflow;44px controls |
| Slider | arrows, keyboard left/right+Enter, horizontal swipe, CTA valid routes | one remaining after expiry/failure, inactive slide expires, touchcancel, vertical scrolling | current item/indicator/retained focus, no autoplay |
| Schedule | UTC7 startNow, future start, expiry end exclusive | browser timezone America/Asia, leap rollover, clock rollback/forward, background tab45s | server-time active DTO and real renderer expiry |
| Draft/publication | editor saves, OWNER previews/publishes, draft later saved | editor publish/hide/mode denied, wrongprovider, unverifiedemail, staff/userlock | actual handler ports + emulator auth/readback |
| Integrity | exact UUID retry returns same version | payloadcollision, stale CAS, simultaneous publish/mode manifest serialization | ports atomic no read-after-write; emulator concurrent |
| Media | PNG/JPEG/WebP static rightsconfirmed, mobileoverride | false rights, wrongmime, truncatedbuffer, animation, hugepixelarea, crosscontent, hide/rightsrevoked duringdownload | actual Sharp + HTTP404; storageaccess staysprivate |
| Admin | paginated30rows,nextstable, create/edit/preview/buttons | timeout uncertain pending exact retry, duplicateclick, reload race, UID A->B->A with late preview/upload/save | actualmount fakeport + native CRM account reset |
| Operations | correctregion,exports,Hostingrewrite,no scheduler | staleasset/adapterbase, missingAppCheck, denied privateFirestore, native serviceownership | exactfreeze,typecheck,lint,build,release gates |

Fixture data must never be inserted into real production. New tests explicitly synthetic port evidence; no proof of Firestore concurrency, Storage authority, billing or live Google session. Root runner owns native/global/services. Production readiness is separate and requires deployed SHA/source readback and trusted OWNER session.
