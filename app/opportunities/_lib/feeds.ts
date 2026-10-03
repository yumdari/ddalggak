import "server-only";

import { createHash } from "node:crypto";
import { classifyField, extractDeadline, type Opportunity, type OpportunityCategory } from "./catalog";

type FeedSource = { name: string; url: string; homepage: string; category: OpportunityCategory };

// Public RSS links published by the source institutions. Add sources only after checking use conditions.
export const FEED_SOURCES: FeedSource[] = [
  {
    name: "인천대학교 대외활동·공모전",
    url: "https://itcenter.inu.ac.kr/bbs/shinbang/327/rssList.do?row=50",
    homepage: "https://itcenter.inu.ac.kr/shinbang/2542/subview.do",
    category: "contest",
  },
  {
    name: "가천대학교 장학공지",
    url: "https://www.gachon.ac.kr/bbs/kor/478/rssList.do?row=50",
    homepage: "https://www.gachon.ac.kr/kor/1146/subview.do",
    category: "scholarship",
  },
];

const MAX_FEED_BYTES = 1_000_000;
let cache: { expires: number; items: Opportunity[] } | null = null;

function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi, (match, code: string) => {
    if (!code.startsWith("#")) return named[code.toLowerCase()] ?? match;
    const point = code[1]?.toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
    try { return String.fromCodePoint(point); } catch { return match; }
  });
}

function plainText(value: string): string {
  const cdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return decodeEntities(decodeEntities(cdata)).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function tagValue(item: string, tag: string): string {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? plainText(match[1]) : "";
}

function sourceLink(raw: string, source: FeedSource): string | null {
  try {
    const url = new URL(raw, source.url);
    if (!(["https:", "http:"].includes(url.protocol))) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "fbclid") url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function publicationDate(raw: string): string | null {
  const full = raw.match(/(20\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (full) return `${full[1]}-${full[2].padStart(2, "0")}-${full[3].padStart(2, "0")}`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString().slice(0, 10);
}

export function parseRss(xml: string, source: FeedSource): Opportunity[] {
  const items: Opportunity[] = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const title = tagValue(match[1], "title");
    const link = sourceLink(tagValue(match[1], "link"), source);
    if (!title || !link) continue;
    if (/선발\s*결과|수상\s*결과|모집\s*마감|신청\s*마감\s*안내/.test(title)) continue;
    const description = tagValue(match[1], "description").slice(0, 2400);
    const publishedAt = publicationDate(tagValue(match[1], "pubDate"));
    items.push({
      id: createHash("sha256").update(link).digest("hex").slice(0, 16),
      title,
      source: source.name,
      sourceUrl: link,
      publishedAt,
      deadline: extractDeadline(`${title} ${description}`),
      category: source.category,
      field: classifyField(`${title} ${description}`, source.category),
      description,
    });
  }
  return items;
}

async function fetchSource(source: FeedSource): Promise<Opportunity[]> {
  const response = await fetch(source.url, { signal: AbortSignal.timeout(9000), cache: "no-store" });
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_FEED_BYTES) throw new Error(`${source.name}: feed too large`);
  return parseRss(new TextDecoder().decode(bytes), source);
}

export async function getOpportunities(): Promise<Opportunity[]> {
  if (cache && cache.expires > Date.now()) return cache.items;
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchSource));
  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (!items.length) {
    if (cache?.items.length) return cache.items;
    throw new Error("공고 출처에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
  const unique = [...new Map(items.map((item) => [item.sourceUrl, item])).values()];
  cache = { expires: Date.now() + 10 * 60_000, items: unique };
  return unique;
}
