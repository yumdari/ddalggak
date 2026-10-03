import "server-only";

import { createHash } from "node:crypto";
import { classifyField, extractDeadline, type Opportunity } from "./catalog";

export const SOURCES = {
  contest: {
    name: "콘테스트코리아",
    url: "https://www.contestkorea.com/sub/list.php?int_gbn=1&displayrow=20",
    homepage: "https://www.contestkorea.com/sub/list.php?int_gbn=1",
  },
  scholarship: {
    name: "국민대학교 장학공지",
    url: "https://www.kookmin.ac.kr/user/kmuNews/notice/7/index.do",
    homepage: "https://www.kookmin.ac.kr/user/kmuNews/notice/7/index.do",
  },
} as const;

const MAX_PAGE_BYTES = 1_000_000;
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
  return decodeEntities(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function field(html: string, className: string): string {
  const match = html.match(new RegExp(`<(span|p|li)[^>]+class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`, "i"));
  return match ? plainText(match[2]) : "";
}

function validDate(year: number, month: number, day: number): string | null {
  const value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = new Date(`${value}T00:00:00+09:00`);
  return Number.isNaN(date.valueOf()) || date.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) !== value ? null : value;
}

function opportunityId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

// Contest Korea's public contest list contains a posting date in str_no and an application period.
export function parseContestList(html: string): Opportunity[] {
  const list = html.split('<div class="list_style_2">')[1] ?? "";
  const blocks = list.split(/<div class="title">/i).slice(1, 21);
  return blocks.flatMap((block): Opportunity[] => {
    const link = block.match(/<a href="(view\.php\?[^"#]+)"/i)?.[1];
    const title = field(block, "txt");
    if (!link || !title) return [];
    const target = field(block.match(/<li class="icon_2"[\s\S]*?<\/li>/i)?.[0] ?? "", "icon_2").replace(/^대상\s*\.\s*/, "");
    if (target && !/누구나|대학생|대학원생/.test(target)) return [];
    const host = field(block.match(/<li class="icon_1"[\s\S]*?<\/li>/i)?.[0] ?? "", "icon_1").replace(/^주최\s*\.\s*/, "");
    const section = field(block, "category");
    const period = field(block, "step-1").replace(/^접수\s*/, "");
    const posted = link.match(/str_no=(20\d{2})(\d{2})(\d{2})\d*/)?.slice(1).map(Number);
    const publishedAt = posted ? validDate(posted[0], posted[1], posted[2]) : null;
    const end = period.match(/~\s*(\d{1,2})\.(\d{1,2})/);
    const endMonth = end ? Number(end[1]) : 0;
    const deadline = posted && end ? validDate(posted[0] + (endMonth < posted[1] ? 1 : 0), endMonth, Number(end[2])) : null;
    const sourceUrl = new URL(link.replaceAll("&amp;", "&"), SOURCES.contest.url).toString();
    const description = [`공모 분야: ${section}`, host && `주최: ${host}`, target && `참가 대상: ${target}`, period && `접수 기간: ${period}`].filter(Boolean).join(". ").slice(0, 2400);
    return [{ id: opportunityId(sourceUrl), title, source: SOURCES.contest.name, sourceUrl,
      publishedAt, deadline, category: "contest", field: classifyField(`${section} ${title} ${description}`, "contest"), description }];
  });
}

type ScholarshipListing = { title: string; sourceUrl: string; publishedAt: string | null };

export function parseScholarshipList(html: string): ScholarshipListing[] {
  const list = html.split('<div class="board_list">')[1] ?? "";
  const matches = list.matchAll(/<a href="(\/user\/kmuNews\/notice\/7\/\d+\/view\.do[^"#]*)"[^>]*>([\s\S]*?)<\/a>/gi);
  return [...matches].slice(0, 20).flatMap((match): ScholarshipListing[] => {
    const title = field(match[2], "title");
    if (!title || /선발\s*(결과|명단)|장학생\s*명단|모집\s*마감/.test(title)) return [];
    const sourceUrl = new URL(match[1].replaceAll("&amp;", "&"), SOURCES.scholarship.url);
    sourceUrl.search = "";
    const date = match[2].match(/class="board_etc"[\s\S]*?<span>(20\d{2})\.(\d{1,2})\.(\d{1,2})<\/span>/i);
    return [{ title, sourceUrl: sourceUrl.toString(), publishedAt: date ? validDate(+date[1], +date[2], +date[3]) : null }];
  });
}

export function parseScholarshipDetail(html: string): { description: string; publishedAt: string | null } {
  const inner = html.match(/<div class="view_inner">([\s\S]*?)<\/div>\s*<\/div>/i)?.[1] ?? "";
  const description = plainText(inner).slice(0, 2400);
  const date = html.match(/작성일\s*(20\d{2})\.(\d{1,2})\.(\d{1,2})/);
  return { description, publishedAt: date ? validDate(+date[1], +date[2], +date[3]) : null };
}

function scholarshipDeadline(title: string, description: string, publishedAt: string | null): string | null {
  const explicit = extractDeadline(`${title} ${description}`);
  if (explicit) return explicit;
  const titleDate = title.match(/\(~\s*(\d{1,2})[./](\d{1,2})\)/);
  if (!titleDate || !publishedAt) return null;
  const year = Number(publishedAt.slice(0, 4));
  const month = Number(titleDate[1]);
  return validDate(year + (month < Number(publishedAt.slice(5, 7)) ? 1 : 0), month, Number(titleDate[2]));
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(9000), cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_PAGE_BYTES) throw new Error(`Page too large: ${url}`);
  return new TextDecoder().decode(bytes);
}

async function fetchContests(): Promise<Opportunity[]> {
  const pages = await Promise.allSettled([1, 2, 3].map((page) => fetchPage(`${SOURCES.contest.url}&page=${page}`)));
  const items = pages.flatMap((page) => page.status === "fulfilled" ? parseContestList(page.value) : []);
  if (!items.length) throw new Error("콘테스트코리아 목록을 읽지 못했습니다.");
  return items;
}

async function fetchScholarships(): Promise<Opportunity[]> {
  const listings = parseScholarshipList(await fetchPage(SOURCES.scholarship.url));
  if (!listings.length) throw new Error("국민대학교 장학공지를 읽지 못했습니다.");
  // Keep request volume low and preserve a listing even when its detail page fails.
  const items: Opportunity[] = [];
  for (let offset = 0; offset < listings.length; offset += 5) {
    const batch = listings.slice(offset, offset + 5);
    const details = await Promise.allSettled(batch.map((item) => fetchPage(item.sourceUrl)));
    for (let index = 0; index < batch.length; index++) {
      const listing = batch[index];
      const response = details[index];
      const detail = response.status === "fulfilled" ? parseScholarshipDetail(response.value) : null;
      const description = detail?.description ?? "";
      const publishedAt = detail?.publishedAt ?? listing.publishedAt;
      items.push({ id: opportunityId(listing.sourceUrl), title: listing.title, source: SOURCES.scholarship.name,
        sourceUrl: listing.sourceUrl, publishedAt,
        deadline: scholarshipDeadline(listing.title, description, publishedAt), category: "scholarship",
        field: classifyField(`${listing.title} ${description}`, "scholarship"), description });
    }
  }
  return items;
}

export async function getOpportunities(): Promise<Opportunity[]> {
  if (cache && cache.expires > Date.now()) return cache.items;
  const results = await Promise.allSettled([fetchContests(), fetchScholarships()]);
  const categories = ["contest", "scholarship"] as const;
  const items = results.flatMap((result, index) => result.status === "fulfilled"
    ? result.value
    : cache?.items.filter((item) => item.category === categories[index]) ?? []);
  if (!items.length) {
    if (cache?.items.length) return cache.items;
    throw new Error("공고 출처에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
  const unique = [...new Map(items.map((item) => [item.sourceUrl, item])).values()];
  cache = { expires: Date.now() + 10 * 60_000, items: unique };
  return unique;
}
