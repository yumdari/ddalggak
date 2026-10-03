"""End-to-end tests for ingestion, review, and personalized delivery."""

import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from ddalggak import create_app
from ddalggak.collector import canonical_url, collect_source, parse_feed
from ddalggak.db import get_db
from ddalggak.domain import deadline_label, deadline_status


class ServiceTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "DATABASE": str(Path(self.directory.name) / "test.sqlite"),
            }
        )
        self.client = self.app.test_client()
        self.token = self.client.get("/api/session").json["csrf_token"]

    def request(self, method, path, data=None):
        return self.client.open(
            path, method=method, json=data, headers={"X-CSRF-Token": self.token}
        )

    def signup(self, email="student@example.com"):
        response = self.request("POST", "/api/signup", {"email": email, "password": "password123"})
        self.assertEqual(response.status_code, 201)
        return response.json["id"]

    def add_candidate(self, suffix="1"):
        with self.app.app_context():
            db = get_db()
            source_id = db.execute(
                "INSERT INTO sources (name, feed_url) VALUES (?, ?)",
                (f"Source {suffix}", f"https://example.com/{suffix}.xml"),
            ).lastrowid
            candidate_id = db.execute(
                """INSERT INTO import_candidates
                   (source_id, source_url, raw_title, detected_at)
                   VALUES (?, ?, ?, ?)""",
                (
                    source_id,
                    f"https://example.com/opportunity/{suffix}",
                    f"공고 {suffix}",
                    "2026-10-03T00:00:00+00:00",
                ),
            ).lastrowid
            db.commit()
        return candidate_id

    def publish(self, candidate_id, **changes):
        body = {
            "type": "scholarship",
            "title": "디자인 장학금",
            "organizer": "한국 장학 기관",
            "eligibility_text": "대학생",
            "application_text": "공식 사이트에서 신청",
            "deadline_kind": "always_open",
            "region": "서울",
            "grade_min": 2,
            "grade_max": 4,
            "tags": ["디자인"],
        }
        body.update(changes)
        return self.request("POST", f"/api/admin/candidates/{candidate_id}/publish", body)

    def test_collection_deduplicates_tracking_urls_and_requires_review(self):
        body = b"""<rss><channel><item><title>Design scholarship</title>
          <link>https://example.com/p/1?utm_source=feed&amp;ref=home</link>
          <description>Details in original</description></item></channel></rss>"""
        self.assertEqual(
            canonical_url("https://EXAMPLE.com/p/1?utm_source=feed&ref=home#part"),
            "https://example.com/p/1?ref=home",
        )
        self.assertEqual(len(parse_feed(body)), 1)
        with self.app.app_context():
            db = get_db()
            source_id = db.execute(
                "INSERT INTO sources (name, feed_url) VALUES ('Feed', 'https://example.com/feed')"
            ).lastrowid
            source = db.execute("SELECT * FROM sources WHERE id = ?", (source_id,)).fetchone()
            self.assertEqual(collect_source(db, source, fetch=lambda _url: body), 1)
            self.assertEqual(collect_source(db, source, fetch=lambda _url: body), 0)
        self.assertEqual(self.client.get("/api/feed").json["items"], [])

    def test_profile_filters_known_mismatch_and_ranks_interests(self):
        admin_id = self.signup("admin@example.com")
        with self.app.app_context():
            db = get_db()
            db.execute("UPDATE users SET role = 'admin' WHERE id = ?", (admin_id,))
            db.commit()
        self.assertEqual(self.publish(self.add_candidate("1")).status_code, 201)
        self.assertEqual(
            self.publish(
                self.add_candidate("2"),
                title="AI 공모전",
                type="contest",
                tags=["AI"],
                region="부산",
                grade_min=1,
                grade_max=1,
            ).status_code,
            201,
        )
        self.request("POST", "/api/logout")
        self.token = self.client.get("/api/session").json["csrf_token"]
        self.signup()
        response = self.request(
            "PUT", "/api/me/profile", {"interests": ["디자인"], "grade": 3, "region": "서울"}
        )
        self.assertEqual(response.status_code, 200)
        items = self.client.get("/api/feed").json["items"]
        self.assertEqual([item["title"] for item in items], ["디자인 장학금"])
        self.assertIn("관심 분야: 디자인", items[0]["reasons"])
        opportunity_id = items[0]["id"]
        self.assertEqual(
            self.request("PUT", f"/api/me/bookmarks/{opportunity_id}").status_code, 204
        )
        self.assertEqual(
            self.request("PUT", f"/api/me/bookmarks/{opportunity_id}").status_code, 204
        )
        self.assertEqual(len(self.client.get("/api/me/bookmarks").json["items"]), 1)
        self.assertEqual(
            self.request("DELETE", f"/api/me/bookmarks/{opportunity_id}").status_code, 204
        )

    def test_review_requires_admin_and_real_deadline(self):
        candidate_id = self.add_candidate()
        self.signup()
        self.assertEqual(self.publish(candidate_id).status_code, 403)
        with self.app.app_context():
            db = get_db()
            db.execute("UPDATE users SET role = 'admin'")
            db.commit()
        invalid = self.publish(
            candidate_id, deadline_kind="datetime", deadline_at="2026-12-31T18:00:00"
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(
            self.publish(
                candidate_id, deadline_kind="date_only", deadline_date="2026-12-31"
            ).status_code,
            201,
        )
        self.assertEqual(self.publish(candidate_id).status_code, 400)
        self.assertEqual(len(self.client.get("/api/feed").json["items"]), 1)

    def test_date_only_uses_korean_calendar_day_without_inventing_time(self):
        row = {"deadline_kind": "date_only", "deadline_date": "2026-10-03"}
        self.assertEqual(
            deadline_status(row, datetime(2026, 10, 3, 14, 59, tzinfo=timezone.utc)), "모집 중"
        )
        self.assertEqual(
            deadline_status(row, datetime(2026, 10, 3, 15, 0, tzinfo=timezone.utc)), "마감"
        )
        self.assertEqual(deadline_label(row), "2026-10-03 · 마감일만 확인됨")

    def test_mutation_requires_csrf_token(self):
        response = self.client.post(
            "/api/signup", json={"email": "student@example.com", "password": "password123"}
        )
        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
