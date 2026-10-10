"""Compare every Functions source archive member with the immutable release package.

Never extract provider archives or print their content. Unexpected paths, files,
dotenv files, duplicate entries and symlinks fail closed.
"""
import hashlib
import json
import stat
import sys
import zipfile


def verify_source(archive, manifest):
    prefix = "deployment/functions/"
    expected = {key[len(prefix):]: value for key, value in manifest["files"].items() if key.startswith(prefix)}
    # Firebase reads this fixed public dotenv before creating source ZIP; it is
    # digest-bound in the bundle and separately verified in deployed env metadata.
    environment = expected.pop(".env.satsunicgo", None)
    if environment is not None:
        fixed = b"PURCHASE_PRODUCTION_TEST_ARTIFACT=v1\nPURCHASE_SEPAY_SANDBOX_ENABLED=true\n"
        if (manifest.get("runtimeEnvironment") != {"PURCHASE_PRODUCTION_TEST_ARTIFACT": "v1", "PURCHASE_SEPAY_SANDBOX_ENABLED": "true"}
                or environment != hashlib.sha256(fixed).hexdigest()):
            raise ValueError("UNSAFE_PUBLIC_RUNTIME_ENVIRONMENT")
    if not expected:
        raise ValueError("EMPTY_EXPECTED_FUNCTION_PACKAGE")
    actual = {}
    with zipfile.ZipFile(archive) as source:
        for entry in source.infolist():
            name = entry.filename
            if entry.is_dir():
                continue
            if name not in expected or name in actual or stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError("UNEXPECTED_PROVIDER_SOURCE_MEMBER")
            if entry.file_size > 100 * 1024 * 1024:
                raise ValueError("OVERSIZED_PROVIDER_SOURCE_MEMBER")
            with source.open(entry) as contents:
                digest = hashlib.sha256()
                while chunk := contents.read(1024 * 1024):
                    digest.update(chunk)
                actual[name] = digest.hexdigest()
    if actual != expected:
        raise ValueError("FUNCTION_SOURCE_HASH_MISMATCH")


if __name__ == "__main__":
    try:
        with open(sys.argv[2], encoding="utf-8") as file:
            verify_source(sys.argv[1], json.load(file))
    except Exception:
        sys.exit("FUNCTION_SOURCE_VERIFICATION_FAILED")
