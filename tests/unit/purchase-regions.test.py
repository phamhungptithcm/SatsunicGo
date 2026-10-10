import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("purchase_regions", "scripts/purchase-regions.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
source = Path("docs/reviews/PAYMENT-UPFRONT-20261008/RECIPIENT-DIRECTORY-20261009/source")


class DirectoryImportTests(unittest.TestCase):
    def test_reproduces_checked_in_asset(self):
        import json
        result = module.build(source / "provinces.xml", source / "communes.xml", "2026-10-09")
        self.assertEqual(result, json.loads(Path("functions/assets/purchase-vn-regions.json").read_text()))

    def test_rejects_external_entity_and_oversized_input(self):
        for payload in [b'<!DOCTYPE x [<!ENTITY leak SYSTEM "file:///etc/passwd">]><x/>', b"x" * 2_000_001]:
            with tempfile.NamedTemporaryFile() as file:
                file.write(payload)
                file.flush()
                with self.assertRaises(ValueError):
                    module.records(file.name, "DanhMucTinh")

    def test_rejects_error_response_and_invalid_date(self):
        with tempfile.NamedTemporaryFile() as file:
            file.write(b"<error>Unavailable</error>")
            file.flush()
            with self.assertRaises(ValueError):
                module.records(file.name, "DanhMucTinh")
        for invalid_date in ["2026-02-30", "20261009", "09/10/2026"]:
            with self.assertRaises(ValueError):
                module.build(source / "provinces.xml", source / "communes.xml", invalid_date)

    def test_rejects_wrong_parent_duplicate_code_and_truncated_directory(self):
        from unittest.mock import patch
        provinces, _ = module.records(source / "provinces.xml", "DanhMucTinh")
        communes, _ = module.records(source / "communes.xml", "DanhMucPhuongXa")
        for changes in [
            [{**communes[0], "MaTinh": "99"}, *communes[1:]],
            [{**communes[0], "TenTinh": "Wrong parent name"}, *communes[1:]],
            [communes[1], *communes[1:]],
            communes[:-1],
        ]:
            with patch.object(module, "records", side_effect=[(provinces, "p"), (changes, "c")]):
                with self.assertRaises(ValueError):
                    module.build("p", "c", "2026-10-09")


if __name__ == "__main__":
    unittest.main()
