"""Extract only the bounded, regular files of a release bundle, without links."""
import os
import sys
import tarfile
from pathlib import PurePosixPath


def unpack(archive, target):
    if os.path.exists(target):
        raise ValueError("ARTIFACT_STAGE_ALREADY_EXISTS")
    with tarfile.open(archive, "r:gz") as source:
        entries = source.getmembers()
        seen = set()
        total = 0
        for entry in entries:
            name = entry.name.removeprefix("./").rstrip("/")
            if not name and entry.isdir():
                continue
            path = PurePosixPath(name)
            if path.is_absolute() or ".." in path.parts or name in seen or not (entry.isfile() or entry.isdir()):
                raise ValueError("UNSAFE_ARCHIVE_MEMBER")
            if path.parts[0] not in {"deployment", "candidate.json", "manifest.json", "release-notes.md"}:
                raise ValueError("UNEXPECTED_ARCHIVE_MEMBER")
            seen.add(name)
            total += entry.size
            if total > 500 * 1024 * 1024 or len(seen) > 20000:
                raise ValueError("OVERSIZED_RELEASE_BUNDLE")
        source.extractall(target, filter="data")


if __name__ == "__main__":
    try:
        unpack(sys.argv[1], sys.argv[2])
    except Exception as error:
        reason = str(error) if isinstance(error, ValueError) else type(error).__name__
        sys.exit("RELEASE_BUNDLE_EXTRACTION_FAILED: " + reason)
