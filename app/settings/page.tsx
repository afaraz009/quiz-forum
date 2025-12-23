'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Check, X, Loader2, ExternalLink, Info } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Gemini model settings
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash-exp');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(40);
  const [maxTokens, setMaxTokens] = useState(2048);

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

      // Load existing settings
      if (data.settings) {
        setGeminiModel(data.settings.geminiModel || 'gemini-2.0-flash-exp');
        setTemperature(data.settings.geminiTemperature ?? 0.7);
        setTopP(data.settings.geminiTopP ?? 0.95);
        setTopK(data.settings.geminiTopK ?? 40);
        setMaxTokens(data.settings.geminiMaxTokens ?? 2048);
      }
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
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          geminiModel,
          geminiTemperature: temperature,
          geminiTopP: topP,
          geminiTopK: topK,
          geminiMaxTokens: maxTokens,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }

      toast.success('Gemini settings saved successfully');
      setHasKey(true);
      setApiKey('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/gemini-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiModel,
          geminiTemperature: temperature,
          geminiTopP: topP,
          geminiTopK: topK,
          geminiMaxTokens: maxTokens,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Gemini model settings saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
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

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gemini API Key</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Gemini Model Configuration</CardTitle>
          <CardDescription>
            Configure the model and parameters for translation feedback and paragraph generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={geminiModel} onValueChange={setGeminiModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</SelectItem>
                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>2.0 Flash (Experimental) offers the best balance of speed and quality for translation tasks</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature: {temperature.toFixed(2)}</Label>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.05}
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Controls randomness. Lower (0.2-0.5) = more focused/consistent, Higher (0.7-1.2) = more creative. Recommended: 0.7 for feedback, 0.9 for generation</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="topP">Top P: {topP.toFixed(2)}</Label>
            </div>
            <Slider
              id="topP"
              min={0}
              max={1}
              step={0.05}
              value={[topP]}
              onValueChange={(value) => setTopP(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Nucleus sampling. Controls diversity. Recommended: 0.90-0.95</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="topK">Top K: {topK}</Label>
            </div>
            <Slider
              id="topK"
              min={1}
              max={100}
              step={1}
              value={[topK]}
              onValueChange={(value) => setTopK(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Limits vocabulary selection. Lower = more focused, Higher = more diverse. Recommended: 40-60</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Output Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min={512}
              max={8192}
              step={256}
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Maximum length of response. Recommended: 2048-4096</span>
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSaveSettings} disabled={isLoading || !hasKey}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setGeminiModel('gemini-2.0-flash-exp');
                setTemperature(0.7);
                setTopP(0.95);
                setTopK(40);
                setMaxTokens(2048);
              }}
            >
              Reset to Defaults
            </Button>
          </div>

          {!hasKey && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please configure your Gemini API key above before adjusting model settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
