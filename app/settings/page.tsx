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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Loader2, ExternalLink, Info, Sparkles, FileText } from 'lucide-react';

interface GeminiModel {
  name: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Feedback settings (translation evaluation)
  const [feedbackModel, setFeedbackModel] = useState('gemini-3-flash-preview');
  const [feedbackTemperature, setFeedbackTemperature] = useState(0.7);
  const [feedbackTopP, setFeedbackTopP] = useState(0.95);
  const [feedbackTopK, setFeedbackTopK] = useState(40);
  const [feedbackMaxTokens, setFeedbackMaxTokens] = useState(8192);

  // Generation settings (paragraph creation)
  const [generationModel, setGenerationModel] = useState('gemini-2.5-flash-lite');
  const [generationTemperature, setGenerationTemperature] = useState(0.9);
  const [generationTopP, setGenerationTopP] = useState(0.95);
  const [generationTopK, setGenerationTopK] = useState(40);
  const [generationMaxTokens, setGenerationMaxTokens] = useState(8192);

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
        // Feedback settings
        setFeedbackModel(data.settings.feedbackModel || 'gemini-2.0-flash-exp');
        setFeedbackTemperature(data.settings.feedbackTemperature ?? 0.7);
        setFeedbackTopP(data.settings.feedbackTopP ?? 0.95);
        setFeedbackTopK(data.settings.feedbackTopK ?? 40);
        setFeedbackMaxTokens(data.settings.feedbackMaxTokens ?? 8192);

        // Generation settings
        setGenerationModel(data.settings.generationModel || 'gemini-2.0-flash-exp');
        setGenerationTemperature(data.settings.generationTemperature ?? 0.9);
        setGenerationTopP(data.settings.generationTopP ?? 0.95);
        setGenerationTopK(data.settings.generationTopK ?? 40);
        setGenerationMaxTokens(data.settings.generationMaxTokens ?? 8192);
      }

      // Fetch available models if API key is configured
      if (data.hasKey) {
        fetchAvailableModels();
      }
    } catch (error) {
      console.error('Failed to check API key status:', error);
    }
  };

  const fetchAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch('/api/settings/gemini-models');
      const data = await res.json();

      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models);
        if (data.usedFallback) {
          toast.info('Using cached model list. Some models may not be available.');
        }
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error('Failed to load available models');
    } finally {
      setIsLoadingModels(false);
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
          feedbackModel,
          feedbackTemperature,
          feedbackTopP,
          feedbackTopK,
          feedbackMaxTokens,
          generationModel,
          generationTemperature,
          generationTopP,
          generationTopK,
          generationMaxTokens,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }

      toast.success('Gemini settings saved successfully');
      setHasKey(true);
      setApiKey('');

      // Fetch models after saving API key
      fetchAvailableModels();
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
          feedbackModel,
          feedbackTemperature,
          feedbackTopP,
          feedbackTopK,
          feedbackMaxTokens,
          generationModel,
          generationTemperature,
          generationTopP,
          generationTopK,
          generationMaxTokens,
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
      setAvailableModels([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove API key');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFeedbackDefaults = () => {
    setFeedbackModel('gemini-3-flash-preview');
    setFeedbackTemperature(0.7);
    setFeedbackTopP(0.95);
    setFeedbackTopK(40);
    setFeedbackMaxTokens(4096);
  };

  const resetGenerationDefaults = () => {
    setGenerationModel('gemini-2.5-flash');
    setGenerationTemperature(0.9);
    setGenerationTopP(0.95);
    setGenerationTopK(40);
    setGenerationMaxTokens(8192);
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

  const ModelSelector = ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      {isLoadingModels ? (
        <div className="flex items-center gap-2 p-2 border rounded">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading models...</span>
        </div>
      ) : availableModels.length > 0 ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.name} value={model.name}>
                <div className="flex flex-col">
                  <span>{model.displayName}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</SelectItem>
            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
            <SelectItem value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B</SelectItem>
            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
          </SelectContent>
        </Select>
      )}
      <p className="text-xs text-muted-foreground flex items-start gap-1">
        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>Experimental models offer the latest features but may be less stable</span>
      </p>
    </div>
  );

  const ParameterControls = ({
    temperature,
    setTemperature,
    topP,
    setTopP,
    topK,
    setTopK,
    maxTokens,
    setMaxTokens,
  }: {
    temperature: number;
    setTemperature: (val: number) => void;
    topP: number;
    setTopP: (val: number) => void;
    topK: number;
    setTopK: (val: number) => void;
    maxTokens: number;
    setMaxTokens: (val: number) => void;
  }) => (
    <>
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
          <span>Controls randomness. Lower = more focused/consistent, Higher = more creative</span>
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
          <span>Nucleus sampling. Controls diversity of word choices</span>
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
          <span>Limits vocabulary selection. Lower = more focused, Higher = more diverse</span>
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
          onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
        />
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>Maximum length of response</span>
        </p>
      </div>
    </>
  );

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
            Configure separate settings for translation feedback and paragraph generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="feedback" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Translation Feedback
              </TabsTrigger>
              <TabsTrigger value="generation" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Paragraph Generation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feedback" className="space-y-6 mt-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Feedback settings</strong> control how the AI evaluates your translations.
                  Lower temperature (0.6-0.8) provides more consistent grading.
                </p>
              </div>

              <ModelSelector
                value={feedbackModel}
                onChange={setFeedbackModel}
                label="Feedback Model"
              />

              <ParameterControls
                temperature={feedbackTemperature}
                setTemperature={setFeedbackTemperature}
                topP={feedbackTopP}
                setTopP={setFeedbackTopP}
                topK={feedbackTopK}
                setTopK={setFeedbackTopK}
                maxTokens={feedbackMaxTokens}
                setMaxTokens={setFeedbackMaxTokens}
              />

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSaveSettings} disabled={isLoading || !hasKey}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Feedback Settings'
                  )}
                </Button>
                <Button variant="outline" onClick={resetFeedbackDefaults}>
                  Reset to Defaults
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="generation" className="space-y-6 mt-6">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-900">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <strong>Generation settings</strong> control how the AI creates Urdu paragraphs.
                  Higher temperature (0.8-1.0) produces more creative and varied text.
                </p>
              </div>

              <ModelSelector
                value={generationModel}
                onChange={setGenerationModel}
                label="Generation Model"
              />

              <ParameterControls
                temperature={generationTemperature}
                setTemperature={setGenerationTemperature}
                topP={generationTopP}
                setTopP={setGenerationTopP}
                topK={generationTopK}
                setTopK={setGenerationTopK}
                maxTokens={generationMaxTokens}
                setMaxTokens={setGenerationMaxTokens}
              />

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSaveSettings} disabled={isLoading || !hasKey}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Generation Settings'
                  )}
                </Button>
                <Button variant="outline" onClick={resetGenerationDefaults}>
                  Reset to Defaults
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {!hasKey && (
            <div className="flex items-start gap-2 p-3 mt-6 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
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
