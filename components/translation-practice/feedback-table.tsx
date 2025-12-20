'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FeedbackRow } from '@/lib/parse-gemini-feedback';

interface FeedbackTableProps {
  feedback: FeedbackRow[];
}

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  if (feedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Great job! No specific feedback items to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Translation Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Urdu Word/Phrase</TableHead>
                  <TableHead className="min-w-[150px]">Your Translation</TableHead>
                  <TableHead className="min-w-[150px]">Suggested Translation</TableHead>
                  <TableHead className="min-w-[200px]">Explanation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((row, index) => {
                  // Determine row color based on difference
                  const isSimilar = row.userTranslation.toLowerCase().trim() ===
                                   row.suggestedTranslation.toLowerCase().trim();
                  const hasMajorDiff = row.explanation.toLowerCase().includes('incorrect') ||
                                       row.explanation.toLowerCase().includes('wrong');

                  let rowClass = '';
                  if (isSimilar) {
                    rowClass = 'bg-green-50 dark:bg-green-950/20';
                  } else if (hasMajorDiff) {
                    rowClass = 'bg-red-50 dark:bg-red-950/20';
                  } else {
                    rowClass = 'bg-yellow-50 dark:bg-yellow-950/20';
                  }

                  return (
                    <TableRow key={index} className={rowClass}>
                      <TableCell
                        dir="rtl"
                        className="font-medium"
                        style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}
                      >
                        {row.urduPhrase}
                      </TableCell>
                      <TableCell>{row.userTranslation}</TableCell>
                      <TableCell className="font-medium">{row.suggestedTranslation}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.explanation}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
