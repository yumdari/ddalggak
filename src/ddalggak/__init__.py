"""Flask application for collected and personalized opportunities."""

import json
import os
import secrets
import sqlite3
from pathlib import Path

import click
from flask import Flask, abort, jsonify, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from .collector import collect_source
from .db import close_db, get_db, init_db
from .domain import (
    ValidationError,
    deadline_label,
    deadline_status,
    normalize_opportunity,
    now_utc,
    valid_url,
)
from .recommend import rank

OPPORTUNITY_COLUMNS = (
    "type",
    "title",
    "organizer",
    "summary",
    "eligibility_text",
    "benefits_text",
    "application_text",
    "region",
    "grade_min",
    "grade_max",
    "start_at",
    "deadline_date",
    "deadline_at",
    "deadline_kind",
    "source_url",
    "source_id",
)


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("DDALGGAK_SECRET_KEY", "development-only-change-me"),
        DATABASE=os.environ.get(
            "DDALGGAK_DATABASE", str(Path(app.instance_path) / "ddalggak.sqlite")
        ),
        JSON_AS_ASCII=False,
    )
    if test_config:
        app.config.update(test_config)
    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()

    @app.errorhandler(ValidationError)
    def invalid(error):
        return jsonify(code="invalid_input", message=str(error)), 400

    @app.errorhandler(401)
    def unauthorized(_error):
        return jsonify(code="authentication_required", message="로그인이 필요합니다."), 401

    @app.errorhandler(403)
    def forbidden(_error):
        return jsonify(code="forbidden", message="접근 권한이 없습니다."), 403

    @app.errorhandler(404)
    def missing(_error):
        return jsonify(code="not_found", message="찾을 수 없습니다."), 404

    @app.before_request
    def verify_csrf():
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and request.path.startswith(
            "/api/"
        ):
            token = session.get("csrf_token")
            if not token or not secrets.compare_digest(
                request.headers.get("X-CSRF-Token", ""), token
            ):
                return jsonify(code="csrf_required", message="보안 토큰이 필요합니다."), 403

    def current_user():
        user_id = session.get("user_id")
        if user_id is None:
            return None
        return get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    def require_user(admin=False):
        user = current_user()
        if user is None:
            abort(401)
        if admin and user["role"] != "admin":
            abort(403)
        return user

    def json_body():
        value = request.get_json(silent=True)
        if not isinstance(value, dict):
            raise ValidationError("JSON 객체를 보내세요.")
        return value

    def serialize(row):
        item = dict(row)
        source = (
            get_db()
            .execute("SELECT name FROM sources WHERE id = ?", (item["source_id"],))
            .fetchone()
        )
        item["source_name"] = source["name"] if source else item["organizer"]
        tags = (
            get_db()
            .execute(
                """SELECT t.name FROM tags t JOIN opportunity_tags ot ON ot.tag_id = t.id
               WHERE ot.opportunity_id = ? ORDER BY t.name""",
                (item["id"],),
            )
            .fetchall()
        )
        item["tags"] = [tag["name"] for tag in tags]
        item["deadline_status"] = deadline_status(item)
        item["deadline_label"] = deadline_label(item)
        return item

    def record_event(opportunity_id, actor_id, action, changed_fields):
        get_db().execute(
            """INSERT INTO audit_events (opportunity_id, actor_id, action, changed_fields, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            (
                opportunity_id,
                actor_id,
                action,
                json.dumps(changed_fields, ensure_ascii=False),
                now_utc(),
            ),
        )

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/api/session")
    def session_info():
        if "csrf_token" not in session:
            session["csrf_token"] = secrets.token_urlsafe(32)
        user = current_user()
        return jsonify(
            csrf_token=session["csrf_token"],
            user=(
                {"id": user["id"], "email": user["email"], "role": user["role"]} if user else None
            ),
        )

    @app.post("/api/signup")
    def signup():
        body = json_body()
        email = str(body.get("email", "")).strip().lower()
        password = body.get("password", "")
        if (
            "@" not in email
            or len(email) > 254
            or not isinstance(password, str)
            or len(password) < 8
        ):
            raise ValidationError("올바른 이메일과 8자 이상의 비밀번호를 입력하세요.")
        db = get_db()
        try:
            user_id = db.execute(
                "INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, 'member', ?)",
                (email, generate_password_hash(password), now_utc()),
            ).lastrowid
            db.commit()
        except sqlite3.IntegrityError as error:
            raise ValidationError("이미 가입한 이메일입니다.") from error
        session["user_id"] = user_id
        return jsonify(id=user_id, email=email), 201

    @app.post("/api/login")
    def login():
        body = json_body()
        email = str(body.get("email", "")).strip().lower()
        user = get_db().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        password = body.get("password", "")
        if (
            not user
            or not isinstance(password, str)
            or not check_password_hash(user["password_hash"], password)
        ):
            return jsonify(
                code="invalid_credentials", message="이메일 또는 비밀번호가 맞지 않습니다."
            ), 401
        session.clear()
        session["user_id"] = user["id"]
        session["csrf_token"] = secrets.token_urlsafe(32)
        return jsonify(
            id=user["id"], email=user["email"], role=user["role"], csrf_token=session["csrf_token"]
        )

    @app.post("/api/logout")
    def logout():
        session.clear()
        return "", 204

    @app.route("/api/me/profile", methods=["GET", "PUT"])
    def profile():
        user = require_user()
        if request.method == "GET":
            return jsonify(
                interests=json.loads(user["interests"]), grade=user["grade"], region=user["region"]
            )
        body = json_body()
        interests = body.get("interests", [])
        grade = body.get("grade")
        region = body.get("region")
        if not isinstance(interests, list) or any(not isinstance(item, str) for item in interests):
            raise ValidationError("관심 분야는 문자열 목록이어야 합니다.")
        interests = sorted({item.strip() for item in interests if item.strip()})
        if len(interests) > 10 or any(len(item) > 30 for item in interests):
            raise ValidationError("관심 분야는 30자 이내로 최대 10개입니다.")
        if grade is not None and (
            not isinstance(grade, int) or isinstance(grade, bool) or not 1 <= grade <= 6
        ):
            raise ValidationError("학년은 1~6 사이의 정수여야 합니다.")
        if region is not None and (not isinstance(region, str) or len(region.strip()) > 30):
            raise ValidationError("지역은 30자 이내여야 합니다.")
        region = region.strip() if region else None
        db = get_db()
        db.execute(
            "UPDATE users SET interests = ?, grade = ?, region = ? WHERE id = ?",
            (json.dumps(interests, ensure_ascii=False), grade, region, user["id"]),
        )
        db.commit()
        return jsonify(interests=interests, grade=grade, region=region)

    @app.get("/api/feed")
    def feed():
        rows = (
            get_db()
            .execute(
                "SELECT * FROM opportunities WHERE status = 'published' ORDER BY created_at DESC LIMIT 500"
            )
            .fetchall()
        )
        items = rank([serialize(row) for row in rows], current_user())
        return jsonify(items=items[:30], total=len(items))

    @app.get("/api/opportunities/<int:opportunity_id>")
    def opportunity_detail(opportunity_id):
        row = (
            get_db()
            .execute(
                "SELECT * FROM opportunities WHERE id = ? AND status = 'published'",
                (opportunity_id,),
            )
            .fetchone()
        )
        if row is None:
            abort(404)
        return jsonify(serialize(row))

    @app.route("/api/me/bookmarks/<int:opportunity_id>", methods=["PUT", "DELETE"])
    def bookmark(opportunity_id):
        user = require_user()
        db = get_db()
        row = db.execute(
            "SELECT id FROM opportunities WHERE id = ? AND status = 'published'", (opportunity_id,)
        ).fetchone()
        if row is None:
            abort(404)
        if request.method == "PUT":
            db.execute(
                "INSERT OR IGNORE INTO bookmarks (user_id, opportunity_id, created_at) VALUES (?, ?, ?)",
                (user["id"], opportunity_id, now_utc()),
            )
        else:
            db.execute(
                "DELETE FROM bookmarks WHERE user_id = ? AND opportunity_id = ?",
                (user["id"], opportunity_id),
            )
        db.commit()
        return "", 204

    @app.get("/api/me/bookmarks")
    def bookmarks():
        user = require_user()
        rows = (
            get_db()
            .execute(
                """SELECT o.* FROM opportunities o JOIN bookmarks b ON b.opportunity_id = o.id
               WHERE b.user_id = ? AND o.status = 'published' ORDER BY b.created_at DESC""",
                (user["id"],),
            )
            .fetchall()
        )
        return jsonify(items=[serialize(row) for row in rows])

    @app.get("/api/admin/candidates")
    def candidates():
        require_user(admin=True)
        rows = (
            get_db()
            .execute(
                """SELECT c.*, s.name AS source_name FROM import_candidates c
               JOIN sources s ON s.id = c.source_id WHERE c.review_status = 'pending'
               ORDER BY c.detected_at DESC"""
            )
            .fetchall()
        )
        return jsonify(items=[dict(row) for row in rows])

    @app.post("/api/admin/candidates/<int:candidate_id>/publish")
    def publish_candidate(candidate_id):
        admin = require_user(admin=True)
        db = get_db()
        candidate = db.execute(
            """SELECT c.*, s.name AS source_name FROM import_candidates c
               JOIN sources s ON s.id = c.source_id WHERE c.id = ?""",
            (candidate_id,),
        ).fetchone()
        if candidate is None:
            abort(404)
        if candidate["review_status"] != "pending":
            raise ValidationError("이미 검수한 후보입니다.")
        body = json_body()
        body["source_url"] = candidate["source_url"]
        body["source_name"] = candidate["source_name"]
        data = normalize_opportunity(body)
        data["source_id"] = candidate["source_id"]
        timestamp = now_utc()
        values = [data[key] for key in OPPORTUNITY_COLUMNS]
        try:
            result = db.execute(
                f"INSERT INTO opportunities ({', '.join(OPPORTUNITY_COLUMNS)}, status, last_verified_at, created_at, updated_at) "
                f"VALUES ({', '.join('?' for _ in OPPORTUNITY_COLUMNS)}, 'published', ?, ?, ?)",
                (*values, timestamp, timestamp, timestamp),
            )
            opportunity_id = result.lastrowid
            for tag_name in data["tags"]:
                db.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,))
                tag_id = db.execute("SELECT id FROM tags WHERE name = ?", (tag_name,)).fetchone()[
                    "id"
                ]
                db.execute(
                    "INSERT INTO opportunity_tags (opportunity_id, tag_id) VALUES (?, ?)",
                    (opportunity_id, tag_id),
                )
            db.execute(
                """UPDATE import_candidates SET review_status = 'published', reviewed_by = ?,
                   opportunity_id = ? WHERE id = ?""",
                (admin["id"], opportunity_id, candidate_id),
            )
            record_event(opportunity_id, admin["id"], "publish", sorted(body))
            db.commit()
        except sqlite3.IntegrityError as error:
            db.rollback()
            raise ValidationError("이미 게시된 원문 URL입니다.") from error
        return jsonify(
            serialize(
                db.execute("SELECT * FROM opportunities WHERE id = ?", (opportunity_id,)).fetchone()
            )
        ), 201

    @app.post("/api/admin/candidates/<int:candidate_id>/reject")
    def reject_candidate(candidate_id):
        admin = require_user(admin=True)
        db = get_db()
        result = db.execute(
            """UPDATE import_candidates SET review_status = 'rejected', reviewed_by = ?
               WHERE id = ? AND review_status = 'pending'""",
            (admin["id"], candidate_id),
        )
        if not result.rowcount:
            abort(404)
        db.commit()
        return "", 204

    @app.post("/api/admin/opportunities/<int:opportunity_id>/hide")
    def hide_opportunity(opportunity_id):
        admin = require_user(admin=True)
        db = get_db()
        result = db.execute(
            "UPDATE opportunities SET status = 'hidden', updated_at = ? WHERE id = ? AND status = 'published'",
            (now_utc(), opportunity_id),
        )
        if not result.rowcount:
            abort(404)
        record_event(opportunity_id, admin["id"], "hide", ["status"])
        db.commit()
        return "", 204

    @app.cli.group("source")
    def source_cli():
        """Manage trusted feeds used by the collector."""

    @source_cli.command("add")
    @click.argument("name")
    @click.argument("feed_url")
    def add_source(name, feed_url):
        if not valid_url(feed_url):
            raise click.BadParameter("Use an http/https feed URL")
        db = get_db()
        db.execute(
            "INSERT INTO sources (name, feed_url, collection_method) VALUES (?, ?, 'rss')",
            (name, feed_url),
        )
        db.commit()
        click.echo(f"Added source: {name}")

    @app.cli.command("collect")
    def collect():
        """Fetch enabled RSS/Atom feeds and queue new entries for review."""
        sources = (
            get_db()
            .execute("SELECT * FROM sources WHERE active = 1 AND feed_url IS NOT NULL")
            .fetchall()
        )
        for source in sources:
            try:
                count = collect_source(get_db(), source)
                click.echo(f"{source['name']}: {count} new candidates")
            except (OSError, ValueError) as error:
                click.echo(f"{source['name']}: collection failed: {error}", err=True)

    @app.cli.command("promote-admin")
    @click.argument("email")
    def promote_admin(email):
        """Promote an existing registered account for local administration."""
        db = get_db()
        result = db.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email.lower(),))
        if not result.rowcount:
            raise click.ClickException("Account not found")
        db.commit()
        click.echo("Admin role granted")

    return app
