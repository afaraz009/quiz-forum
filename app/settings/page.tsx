'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, X, Loader2, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      checkApiKeyStatus();
    }
  }, [status, router]);

  const checkApiKeyStatus = async () => {
    try {
      const res = await fetch('/api/settings/gemini-key');
      const data = await res.json();
      setHasKey(data.hasKey);
    } catch (error) {
      console.error('Failed to check API key status:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }

      toast.success('Gemini API key saved successfully');
      setHasKey(true);
      setApiKey('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/gemini-key', {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove API key');
      }

      toast.success('Gemini API key removed successfully');
      setHasKey(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove API key');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gemini API Settings</CardTitle>
              <CardDescription>
                Configure your Gemini API key for translation practice
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasKey ? (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Configured</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">No API Key</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              disabled={isLoading || isTesting}
            />
            <p className="text-sm text-muted-foreground">
              Your API key is encrypted and stored securely. It will never be shared or exposed.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!apiKey.trim() || isLoading || isTesting}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save API Key'
              )}
            </Button>

            {hasKey && (
              <Button
                onClick={handleRemove}
                variant="destructive"
                disabled={isLoading || isTesting}
              >
                Remove API Key
              </Button>
            )}
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">How to get a Gemini API key:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Visit Google AI Studio</li>
              <li>Sign in with your Google account</li>
              <li>Click "Get API Key" and create a new key</li>
              <li>Copy the key and paste it above</li>
            </ol>
            <Button
              asChild
              variant="link"
              className="px-0 mt-2"
            >
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Gemini API Key
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
