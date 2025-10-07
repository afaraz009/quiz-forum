"use client";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface FormattedCodeBlockProps {
  code: string;
  language?: string;
}

export function FormattedCodeBlock({ code, language = 'text' }: FormattedCodeBlockProps) {
  // If no code, return empty
  if (!code) return null;

  // Extract language from code block if not provided
  const extractLanguageAndCode = (codeString: string) => {
    // Match code blocks with language specification like ```js or ```javascript
    const fencedMatch = codeString.match(/^```([a-zA-Z]+)?\s*([\s\S]*?)```$/);
    if (fencedMatch) {
      return {
        lang: fencedMatch[1] || language,
        cleanCode: fencedMatch[2].trim()
      };
    }
    
    // Match inline code snippets wrapped in single backticks
    const inlineMatch = codeString.match(/^`([^`]+)`$/);
    if (inlineMatch && !inlineMatch[1].includes('\n')) {
      return {
        lang: 'text',
        cleanCode: inlineMatch[1]
      };
    }
    
    // If no code block pattern found, return as plain text
    return { lang: language, cleanCode: codeString };
  };

  const { lang, cleanCode } = extractLanguageAndCode(code);

  // Handle fenced code blocks (```code```)
  if (code.startsWith('```') && code.endsWith('```')) {
    return (
      <div className="my-2 rounded-lg overflow-hidden">
        <SyntaxHighlighter 
          language={lang} 
          style={oneDark}
          customStyle={{
            borderRadius: '0.5rem',
            padding: '1rem',
            fontSize: '0.9rem',
            margin: 0
          }}
        >
          {cleanCode}
        </SyntaxHighlighter>
      </div>
    );
  }

  // Handle inline code snippets (`code`)
  if (code.startsWith('`') && code.endsWith('`') && !code.includes('\n')) {
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
        {cleanCode}
      </code>
    );
  }

  // If it's not a code block, return as plain text
  return <span>{code}</span>;
}