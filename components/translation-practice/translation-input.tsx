'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface TranslationInputProps {
  onSubmit: (translation: string) => void;
  isLoading?: boolean;
  sessionId: string;
}

export function TranslationInput({ onSubmit, isLoading = false, sessionId }: TranslationInputProps) {
  const [translation, setTranslation] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null);

  // Auto-save to localStorage every 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (translation.trim()) {
        localStorage.setItem(`translation-draft-${sessionId}`, translation);
        setAutoSaveStatus('saving');
        setTimeout(() => setAutoSaveStatus('saved'), 500);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [translation, sessionId]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`translation-draft-${sessionId}`);
    if (draft) {
      setTranslation(draft);
    }
  }, [sessionId]);

  const handleSubmit = () => {
    if (translation.trim()) {
      onSubmit(translation);
      // Clear draft after submission
      localStorage.removeItem(`translation-draft-${sessionId}`);
      setTranslation('');
    }
  };

  const charCount = translation.length;
  const maxChars = 2000;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your English Translation</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {autoSaveStatus === 'saving' && (
              <span className="text-xs">Saving...</span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-xs text-green-600">Draft saved</span>
            )}
            <span className={charCount > maxChars ? 'text-destructive' : ''}>
              {charCount}/{maxChars}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="Type your English translation here..."
          className="min-h-[150px] text-base"
          disabled={isLoading}
          maxLength={maxChars}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!translation.trim() || isLoading || charCount > maxChars}
            size="lg"
            className="min-w-[150px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Translation
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
