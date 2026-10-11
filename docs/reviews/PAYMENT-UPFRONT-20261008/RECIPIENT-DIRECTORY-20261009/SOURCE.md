# Official directory snapshot

Public authority: Cục Thống kê, https://danhmuchanhchinh.nso.gov.vn/.
Documented public service: https://danhmuchanhchinh.nso.gov.vn/WebService.aspx.
SOAP endpoint: https://danhmuchanhchinh.nso.gov.vn/DMDVHC.asmx; contract retrieved from the endpoint with `?WSDL`.

Retrieved 2026-10-09 using read-only public directory methods with the same `DenNgay=09/10/2026`:
- `DanhMucTinh`: no further filters, 34 TABLE rows.
- `DanhMucPhuongXa`: Tinh, TenTinh, QuanHuyen and TenQuanHuyen all empty, 3,321 TABLE rows.

Raw responses are retained in source/provinces.xml and source/communes.xml. They contain public administrative reference data only. No account, customer, payment or credential material is present. The generated asset records SHA256 of each raw response. The importer rejects oversized XML, DOCTYPE/ENTITY, wrong response type, unexpected counts, duplicate/malformed codes, missing parents and inconsistent parent names.

Reproduce without network:
```sh
python3 -B scripts/purchase-regions.py --provinces docs/reviews/PAYMENT-UPFRONT-20261008/RECIPIENT-DIRECTORY-20261009/source/provinces.xml --communes docs/reviews/PAYMENT-UPFRONT-20261008/RECIPIENT-DIRECTORY-20261009/source/communes.xml --as-of 2026-10-09 --output functions/assets/purchase-vn-regions.json
```

The community API https://provinces.open-api.vn/api/v2/?depth=2 was also fetched today and still returned old names. Comparison with the previous bundled snapshot: zero codes added/removed, zero parent reassignment, 31 province/commune names corrected; full deterministic change list in DATA-DIFF.json. Counts alone would not have caught this freshness defect.

Local runtime: updated only demo-satsunicgo/settings/purchaseRegions after a private /private/tmp document backup, optimistic full-document hash guard and transaction, followed by readback. Receipt DEMO-SYNC.json. All unrelated settings metadata is merged/preserved; prices, policies, customer/order records and provider state are outside this operation. No shared service restart/reset was performed. Reopening/reloading checkout fetches the new snapshot; an already mounted checkout may retain its previously loaded setup until then.

Rollback: the exact prior public directory is in the mode0600 backup path recorded in DEMO-SYNC.json. If rollback becomes necessary, coordinate first, check the current document hash and restore only the directory fields in an emulator-only transaction. No rollback was executed and no production operation is authorized by this script. Future count/code/parent changes must be reviewed rather than bypassing importer validation. Production directory installation/deployment has not been performed.
