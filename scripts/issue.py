#!/usr/bin/env python3
"""Create an issue branch, then commit and push its finished work."""

import argparse
import re
import subprocess
import sys


ISSUE_BRANCH = re.compile(r"issue/([1-9][0-9]*)-[a-z0-9]+(?:-[a-z0-9]+)*\Z")
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")


class WorkflowError(Exception):
    pass


def git(*args, capture=False, check=True):
    result = subprocess.run(
        ["git", *args],
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        check=False,
    )
    if check and result.returncode:
        detail = (result.stderr or "").strip()
        raise WorkflowError(detail or f"git {' '.join(args)} failed")
    return result


def branch_name():
    return git("branch", "--show-current", capture=True).stdout.strip()


def require_issue_branch(issue):
    branch = branch_name()
    match = ISSUE_BRANCH.fullmatch(branch)
    if not match or match.group(1) != issue:
        raise WorkflowError(f"Issue #{issue} requires an issue/{issue}-<slug> branch; current: {branch}")
    return branch


def require_clean_tree():
    if git("status", "--porcelain", capture=True).stdout:
        raise WorkflowError("Working tree has changes. Commit, stash, or discard them before starting an issue.")


def start(issue, slug, base):
    if not SLUG.fullmatch(slug):
        raise WorkflowError("Slug must use lowercase letters, digits, and single hyphens.")
    require_clean_tree()
    branch = f"issue/{issue}-{slug}"
    git("show-ref", "--verify", f"refs/heads/{base}", capture=True)
    git("switch", "-c", branch, base)
    print(f"Started issue #{issue} on {branch} (base: local {base}).")


def finish(issue, message, paths):
    branch = require_issue_branch(issue)
    if not message.strip() or "\n" in message:
        raise WorkflowError("Commit message must be a nonempty, single-line subject.")
    if paths:
        git("add", "--", *paths)
    if git("diff", "--cached", "--quiet", check=False).returncode == 0:
        raise WorkflowError("Nothing is staged. Pass changed file paths or stage them first.")
    if git("diff", "--quiet", check=False).returncode != 0:
        raise WorkflowError("Unstaged changes remain. Include their paths before finishing.")
    if git("ls-files", "--others", "--exclude-standard", capture=True).stdout:
        raise WorkflowError("Untracked files remain. Include their paths before finishing.")
    git("diff", "--cached", "--check")
    git("var", "GIT_AUTHOR_IDENT", capture=True)
    git("commit", "-m", f"{message.strip()} (#{issue})")
    try:
        git("push", "-u", "origin", branch)
    except WorkflowError as error:
        raise WorkflowError(
            f"Commit succeeded, but push failed: {error}\n"
            f"Retry with: python3 scripts/issue.py push {issue}"
        ) from error
    print(f"Committed and pushed issue #{issue} on {branch}.")


def push(issue):
    branch = require_issue_branch(issue)
    require_clean_tree()
    git("push", "-u", "origin", branch)
    print(f"Pushed issue #{issue} on {branch}.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)

    start_parser = commands.add_parser("start", help="create an issue branch from a local base branch")
    start_parser.add_argument("issue", help="positive GitHub issue number")
    start_parser.add_argument("slug", help="short lowercase branch name suffix")
    start_parser.add_argument("--base", default="master", help="local base branch (default: master)")

    finish_parser = commands.add_parser("finish", help="commit staged or named changes and push")
    finish_parser.add_argument("issue", help="positive GitHub issue number")
    finish_parser.add_argument("message", help="short imperative commit subject")
    finish_parser.add_argument("paths", nargs="*", help="changed paths to stage; omit if already staged")

    push_parser = commands.add_parser("push", help="retry a failed push without another commit")
    push_parser.add_argument("issue", help="positive GitHub issue number")

    args = parser.parse_args()
    if not re.fullmatch(r"[1-9][0-9]*", args.issue):
        parser.error("issue must be a positive number")
    try:
        git("rev-parse", "--show-toplevel", capture=True)
        if args.command == "start":
            start(args.issue, args.slug, args.base)
        elif args.command == "finish":
            finish(args.issue, args.message, args.paths)
        else:
            push(args.issue)
    except WorkflowError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
