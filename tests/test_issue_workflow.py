"""Integration tests for the local issue branch workflow."""

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "issue.py"


class IssueWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        root = Path(self.directory.name)
        self.remote = root / "remote.git"
        self.work = root / "work"
        self.run_command(
            "git", "init", "--bare", "--initial-branch=master", str(self.remote), cwd=root
        )
        self.run_command("git", "init", "--initial-branch=master", str(self.work), cwd=root)
        self.run_command("git", "config", "user.name", "Test User")
        self.run_command("git", "config", "user.email", "test@example.com")
        (self.work / "README.md").write_text("Initial\n", encoding="utf-8")
        self.run_command("git", "add", "README.md")
        self.run_command("git", "commit", "-m", "Initial commit")
        self.run_command("git", "remote", "add", "origin", str(self.remote))
        self.run_command("git", "push", "-u", "origin", "master")

    def run_command(self, *command, cwd=None, succeeds=True):
        result = subprocess.run(
            command,
            cwd=cwd or self.work,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if succeeds and result.returncode:
            self.fail(f"{command} failed:\n{result.stdout}\n{result.stderr}")
        return result

    def workflow(self, *arguments, succeeds=True):
        return self.run_command(sys.executable, str(SCRIPT), *arguments, succeeds=succeeds)

    def test_finish_commits_named_file_and_pushes_issue_branch(self):
        self.workflow("start", "42", "scholarship-search")
        (self.work / "feature.txt").write_text("Search\n", encoding="utf-8")
        self.workflow("finish", "42", "Add scholarship search", "feature.txt")

        self.assertEqual(
            self.run_command("git", "log", "-1", "--format=%s").stdout.strip(),
            "Add scholarship search (#42)",
        )
        self.assertEqual(
            self.run_command("git", "rev-parse", "HEAD").stdout,
            self.run_command(
                "git",
                "--git-dir",
                str(self.remote),
                "rev-parse",
                "refs/heads/issue/42-scholarship-search",
            ).stdout,
        )

    def test_start_refuses_dirty_worktree(self):
        (self.work / "feature.txt").write_text("Uncommitted\n", encoding="utf-8")
        result = self.workflow("start", "42", "scholarship-search", succeeds=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Working tree has changes", result.stderr)
        self.assertEqual(
            self.run_command("git", "branch", "--show-current").stdout.strip(), "master"
        )

    def test_finish_refuses_wrong_issue_or_leftover_files(self):
        self.workflow("start", "42", "scholarship-search")
        (self.work / "feature.txt").write_text("Search\n", encoding="utf-8")
        (self.work / "leftover.txt").write_text("Untracked\n", encoding="utf-8")
        wrong_issue = self.workflow("finish", "43", "Add search", "feature.txt", succeeds=False)
        self.assertIn("requires an issue/43-<slug> branch", wrong_issue.stderr)
        leftover = self.workflow("finish", "42", "Add search", "feature.txt", succeeds=False)
        self.assertIn("Untracked files remain", leftover.stderr)
        self.assertEqual(
            self.run_command("git", "log", "-1", "--format=%s").stdout.strip(), "Initial commit"
        )

    def test_failed_push_can_be_retried_without_another_commit(self):
        self.workflow("start", "42", "scholarship-search")
        (self.work / "feature.txt").write_text("Search\n", encoding="utf-8")
        self.run_command("git", "remote", "set-url", "origin", str(self.work / "missing.git"))
        failure = self.workflow("finish", "42", "Add search", "feature.txt", succeeds=False)
        self.assertIn("Commit succeeded, but push failed", failure.stderr)
        committed_head = self.run_command("git", "rev-parse", "HEAD").stdout

        self.run_command("git", "remote", "set-url", "origin", str(self.remote))
        self.workflow("push", "42")
        self.assertEqual(committed_head, self.run_command("git", "rev-parse", "HEAD").stdout)
        self.assertEqual(
            committed_head,
            self.run_command(
                "git",
                "--git-dir",
                str(self.remote),
                "rev-parse",
                "refs/heads/issue/42-scholarship-search",
            ).stdout,
        )


if __name__ == "__main__":
    unittest.main()
