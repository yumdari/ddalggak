"""Import RSS and Atom entries into a review queue."""

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree

from .domain import now_utc, valid_url

TRACKING_KEYS = {"fbclid", "gclid"}


def canonical_url(url):
    if not valid_url(url):
        raise ValueError("Invalid source URL")
    parts = urlsplit(url.strip())
    query = urlencode(
        sorted(
            [
                (key, value)
                for key, value in parse_qsl(parts.query, keep_blank_values=True)
                if not key.lower().startswith("utm_") and key.lower() not in TRACKING_KEYS
            ]
        )
    )
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path, query, ""))


def parse_feed(body):
    """Return title, URL, and summary from common RSS 2.0 and Atom feeds."""
    root = ElementTree.fromstring(body)
    entries = []
    for item in root.findall("./channel/item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        summary = (item.findtext("description") or "").strip()
        if title and valid_url(link):
            entries.append((title, canonical_url(link), summary))
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    for item in root.findall("atom:entry", ns):
        title = (item.findtext("atom:title", default="", namespaces=ns) or "").strip()
        links = item.findall("atom:link", ns)
        link = next(
            (node.get("href", "") for node in links if node.get("rel", "alternate") == "alternate"),
            "",
        )
        summary = (
            item.findtext("atom:summary", default="", namespaces=ns)
            or item.findtext("atom:content", default="", namespaces=ns)
            or ""
        ).strip()
        if title and valid_url(link):
            entries.append((title, canonical_url(link), summary))
    return entries


def collect_source(db, source, fetch=None):
    if fetch is None:

        def fetch(url):
            request = Request(url, headers={"User-Agent": "ddalggak/0.1 (+feed collector)"})
            with urlopen(request, timeout=15) as response:
                body = response.read(2_000_001)
            if len(body) > 2_000_000:
                raise ValueError("Feed exceeds 2 MB")
            return body

    entries = parse_feed(fetch(source["feed_url"]))
    added = 0
    for title, url, summary in entries:
        if db.execute("SELECT 1 FROM opportunities WHERE source_url = ?", (url,)).fetchone():
            continue
        result = db.execute(
            """INSERT OR IGNORE INTO import_candidates
               (source_id, source_url, raw_title, raw_content, detected_at)
               VALUES (?, ?, ?, ?, ?)""",
            (source["id"], url, title, summary, now_utc()),
        )
        added += result.rowcount
    db.commit()
    return added
