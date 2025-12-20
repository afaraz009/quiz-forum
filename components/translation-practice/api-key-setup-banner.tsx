'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Settings } from 'lucide-react';
import Link from 'next/link';

export function ApiKeySetupBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('api-key-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('api-key-banner-dismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <Alert className="mb-6">
      <Settings className="h-4 w-4" />
      <AlertTitle>Gemini API Key Required</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          To use the translation practice feature, you need to configure your Gemini API key in settings.
        </span>
        <div className="flex gap-2 flex-shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">Go to Settings</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
