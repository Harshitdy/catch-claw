import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Props = { content: string; isUser?: boolean }

export default function ChatMarkdown({ content, isUser }: Props) {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{content}</span>
  }

  if (!content.trim()) {
    return <span className="inline-block w-2 h-4 animate-pulse rounded-sm bg-current opacity-40" aria-hidden />
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[0.9375rem] font-semibold mt-3 mb-2 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1.5 first:mt-0">{children}</h3>,
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} className="text-primary dark:text-dark-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        code: ({ className, children, ...props }) => (
          <code
            className={
              className?.includes('language-')
                ? `font-mono text-xs ${className}`
                : 'px-1 py-0.5 rounded text-[0.8125rem] bg-black/10 dark:bg-black/30 font-mono'
            }
            {...props}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-lg bg-black/10 dark:bg-black/30 px-3 py-2 text-xs">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/50 dark:border-dark-primary/50 pl-3 my-2 text-on-surface-variant dark:text-dark-on-surface-variant italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-outline/40 dark:border-dark-outline/40" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
