# Repository agent instructions

For work tied to a numbered GitHub issue, use `python3 scripts/issue.py start <issue> <slug>` before editing. After implementation and verification, use `python3 scripts/issue.py finish <issue> "<imperative subject>" <changed-path>...` to commit and push the completed issue. If only the push fails, retry with `python3 scripts/issue.py push <issue>` and report the failure if it persists. Do not invent an issue number for work that has none. Follow the parent repository guidelines for code, tests, and documentation.
