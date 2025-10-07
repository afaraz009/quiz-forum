# Code Formatting in Quiz Questions

This document explains how code formatting works in quiz questions.

## Features

1. **Syntax Highlighting**: Code blocks in questions and options are automatically syntax highlighted
2. **Multiple Languages**: Supports JavaScript, CSS, HTML, Python, and many other languages
3. **Inline Code**: Single backtick code snippets are formatted appropriately
4. **Responsive Design**: Code blocks are responsive and scrollable when needed

## Usage

### Code Blocks

To include a code block in a question or option, wrap your code with triple backticks and specify the language:

```json
{
  "question": "What is the output of the following JavaScript code?\n```js\nconsole.log(2 + '2');\n```",
  "options": [
    "`4`",
    "`22`",
    "`NaN`",
    "`undefined`"
  ],
  "correctAnswer": "`22`"
}
```

### Supported Languages

- JavaScript (`js`)
- CSS (`css`)
- HTML (`html`)
- Python (`python`)
- Java (`java`)
- C++ (`cpp`)
- And many more...

### Inline Code

For inline code snippets, use single backticks:

```json
{
  "question": "What is the correct way to declare a variable in Python?",
  "options": [
    "`var x = 5`",
    "`let x = 5`",
    "`x = 5`",
    "`int x = 5`"
  ],
  "correctAnswer": "`x = 5`"
}
```

## Implementation Details

The code formatting is implemented using:
- `react-syntax-highlighter` for syntax highlighting
- `oneDark` theme for consistent dark/light mode support
- Custom CSS for responsive design
- Automatic language detection from code block markers

## Styling

Code blocks are styled with:
- Rounded corners
- Appropriate padding
- Scrollable overflow for long lines
- Consistent font family (Fira Code)