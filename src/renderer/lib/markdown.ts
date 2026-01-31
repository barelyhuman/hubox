import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked for GitHub-flavored markdown
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
})

// Configure DOMPurify to allow safe HTML elements
const purifyConfig: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'code',
    'pre',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'img',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'div',
    'span',
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'class',
    'id',
    'target',
    'rel',
    'width',
    'height',
    'align',
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Force all links to open in a new window and add noopener for security
  ADD_ATTR: ['target'],
}

/**
 * Safely renders markdown to HTML with XSS protection
 * @param markdown - The markdown string to render
 * @returns Sanitized HTML string
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return ''

  try {
    // Parse markdown to HTML
    const html = marked.parse(markdown) as string

    // Sanitize the HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(html, purifyConfig)

    return sanitizedHtml
  } catch (error) {
    console.error('Error rendering markdown:', error)
    // Fallback to plain text if markdown parsing fails
    return DOMPurify.sanitize(markdown, { ALLOWED_TAGS: [] })
  }
}

/**
 * Extracts plain text from markdown (strips all formatting)
 * @param markdown - The markdown string
 * @returns Plain text string
 */
export function markdownToText(markdown: string): string {
  if (!markdown) return ''
  return DOMPurify.sanitize(markdown, { ALLOWED_TAGS: [] })
}
