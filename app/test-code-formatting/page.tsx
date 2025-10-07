"use client";

import { useState } from "react";
import { Quiz } from "@/components/quiz";

export default function TestCodeFormatting() {
  const [questions] = useState([
    {
      question: "What is the output of this JavaScript code?\n```js\nconsole.log(2 + '2');\n```",
      options: [
        "4",
        "22",
        "NaN",
        "undefined"
      ],
      correctAnswer: "22"
    },
    {
      question: "Which of the following is the correct way to declare a variable in Python?",
      options: [
        "`var x = 5`",
        "`let x = 5`",
        "`x = 5`",
        "`int x = 5`"
      ],
      correctAnswer: "`x = 5`"
    },
    {
      question: "What does the following CSS do?\n```css\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n```",
      options: [
        "Makes the container invisible",
        "Centers content both horizontally and vertically",
        "Changes the container color to blue",
        "Adds a border to the container"
      ],
      correctAnswer: "Centers content both horizontally and vertically"
    }
  ]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Code Formatting Test</h1>
      <div className="max-w-4xl">
        <Quiz questions={questions} />
      </div>
    </div>
  );
}