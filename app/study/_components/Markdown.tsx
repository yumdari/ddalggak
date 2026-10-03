"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import "./markdown.css";

// 모델이 쓰는 수식 표기를 파서가 읽을 수 있는 모양으로 맞춘다
// - \[...\] → $$...$$, \(...\) → $...$
// - $$...$$ 는 앞뒤에 빈 줄을 두고 여는·닫는 $$ 를 각자 한 줄에 둔다 (같은 줄에 붙어 있으면 블록이 안 닫힌다)
function normalizeMath(text: string) {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `\n\n$$\n${m.trim()}\n$$\n\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m.trim()}$`)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `\n\n$$\n${m.trim()}\n$$\n\n`);
}

// 마크다운(굵게·목록·표·코드)과 LaTeX 수식($...$, $$...$$)을 화면에 그린다
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeMath(children)}
      </ReactMarkdown>
    </div>
  );
}
