import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:text-[var(--text-1)] prose-p:text-[var(--text-2)] prose-a:text-[var(--blue)] prose-strong:text-[var(--text-1)] prose-code:text-[var(--primary)] prose-code:bg-[var(--tag-bg)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-[var(--bg)] prose-pre:border-[var(--border-w)] prose-pre:border-[var(--border-color)] prose-li:text-[var(--text-2)] prose-blockquote:border-[var(--border-color)] prose-blockquote:text-[var(--text-3)] prose-hr:border-[var(--border-color)] prose-img:rounded-lg prose-table:text-[var(--text-2)] prose-th:text-[var(--text-1)] prose-td:border-[var(--border-color)] prose-th:border-[var(--border-color)]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
