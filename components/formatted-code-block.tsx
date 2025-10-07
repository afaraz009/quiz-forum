"use client";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface FormattedCodeBlockProps {
  code: string;
}

export function FormattedCodeBlock({ code }: FormattedCodeBlockProps) {
  // Log what we receive
  console.log("FormattedCodeBlock received:", code);
  
  // Convert escaped newlines to actual newlines
  const processedCode = code.replace(/\\n/g, '\n');
  console.log("Processed code:", processedCode);
  
  // Check for code blocks (```language)
  const codeBlockRegex = /^```(\w+)\n([\s\S]*?)\n```$/;
  const codeBlockMatch = processedCode.match(codeBlockRegex);
  
  if (codeBlockMatch) {
    const language = codeBlockMatch[1];
    const codeContent = codeBlockMatch[2];
    
    return (
      <div className="my-2 rounded-lg overflow-hidden">
        <SyntaxHighlighter 
          language={language} 
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
          }}
          codeTagProps={{
            style: {
              fontFamily: '"Fira Code", monospace',
              lineHeight: '1.5',
            }
          }}
        >
          {codeContent}
        </SyntaxHighlighter>
      </div>
    );
  }
  
  // Check for inline code (`code`)
  const inlineCodeRegex = /^`(.*)`$/;
  const inlineCodeMatch = processedCode.match(inlineCodeRegex);
  
  if (inlineCodeMatch) {
    return (
      <code className="px-1.5 py-0.5 bg-muted rounded-md font-mono text-sm">
        {inlineCodeMatch[1]}
      </code>
    );
  }
  
  // Plain text
  return <span>{processedCode}</span>;
}