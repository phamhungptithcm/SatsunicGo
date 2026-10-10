# Raw log preservation

Raw owner and candidate tool logs retain their original bytes, including emitted trailing spaces and blank lines, so receipt hashes remain valid. `git diff --cached --check` reports only these raw log lines; the source, tests, plans and review documents pass the same check with raw `*.log` excluded. No product source whitespace finding was suppressed and no raw failure/warning evidence was edited.
