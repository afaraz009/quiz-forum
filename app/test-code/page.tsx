"use client";

import { FormattedCodeBlock } from "@/components/formatted-code-block";

export default function TestCodePage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Code Formatting Test</h1>
      
      <div className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">JavaScript Code Block</h2>
          <FormattedCodeBlock 
            code="```js
function helloWorld() {
  console.log('Hello, world!');
  return true;
}
```" 
          />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">CSS Code Block</h2>
          <FormattedCodeBlock 
            code="```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
```" 
          />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Inline Code</h2>
          <p>This is a paragraph with <FormattedCodeBlock code="`inline code`" /> in the middle.</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Plain Text</h2>
          <p>This is plain text without any code formatting.</p>
        </div>
      </div>
    </div>
  );
}