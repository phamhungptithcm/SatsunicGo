"""Build the checkout directory from dated NSO public SOAP responses (no network)."""

import argparse
import hashlib
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET
from datetime import date


def records(path, method):
    with Path(path).open("rb") as source:
        data = source.read(2_000_001)
    if len(data) > 2_000_000 or re.search(br"<!\s*(DOCTYPE|ENTITY)", data, re.I):
        raise ValueError("Unsafe or oversized reference XML")
    root = ET.fromstring(data)
    if root.find(f".//{{http://tempuri.org/}}{method}Response") is None:
        raise ValueError(f"Expected {method} response, not an error or unrelated XML")
    rows = [
        {field.tag: (field.text or "").strip() for field in row}
        for row in root.iter("TABLE")
    ]
    return rows, hashlib.sha256(data).hexdigest()


def build(province_file, commune_file, as_of):
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", as_of):
        raise ValueError("Expected an ISO date YYYY-MM-DD")
    date.fromisoformat(as_of)
    provinces, province_hash = records(province_file, "DanhMucTinh")
    communes, commune_hash = records(commune_file, "DanhMucPhuongXa")
    if len(provinces) != 34 or len(communes) != 3321:
        raise ValueError("Unexpected nationwide counts; review administrative changes first")
    directory = {}
    for row in provinces:
        code, name = row["MaTinh"], row["TenTinh"]
        if not re.fullmatch(r"[0-9]{2}", code) or code in directory or not 2 <= len(name) <= 120:
            raise ValueError("Invalid/duplicate province code or name")
        directory[code] = {"code": code, "name": name, "communes": []}
    seen = set()
    for row in communes:
        parent, code, name = row["MaTinh"], row["MaPhuongXa"], row["TenPhuongXa"]
        if (
            parent not in directory
            or row["TenTinh"] != directory[parent]["name"]
            or not re.fullmatch(r"[0-9]{5}", code)
            or code in seen
            or not 2 <= len(name) <= 120
        ):
            raise ValueError("Invalid/duplicate commune or inconsistent province relationship")
        seen.add(code)
        directory[parent]["communes"].append({"code": code, "name": name})
    for province in directory.values():
        if not province["communes"]:
            raise ValueError("Province without communes")
        province["communes"].sort(key=lambda row: row["code"])
    return {
        "source": "https://danhmuchanhchinh.nso.gov.vn/DMDVHC.asmx",
        "retrievedAt": as_of,
        "asOf": as_of,
        "sourceMethods": ["DanhMucTinh", "DanhMucPhuongXa"],
        "sourceSha256": {"provinces": province_hash, "communes": commune_hash},
        "provinces": [directory[code] for code in sorted(directory)],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provinces", required=True)
    parser.add_argument("--communes", required=True)
    parser.add_argument("--as-of", required=True, help="ISO date used in both NSO queries")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    result = build(args.provinces, args.communes, args.as_of)
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"provinces": len(result["provinces"]), "communes": sum(len(p["communes"]) for p in result["provinces"]), "asOf": result["asOf"]}))
