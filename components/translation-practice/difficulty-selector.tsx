'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BookOpen, GraduationCap, Trophy } from 'lucide-react';

interface DifficultySelectorProps {
  onStart: (level: number) => void;
  isLoading?: boolean;
}

const DIFFICULTY_LEVELS = [
  {
    level: 1,
    title: 'Beginner',
    description: 'Simple vocabulary, short sentences, everyday topics',
    icon: BookOpen,
    color: 'text-green-600',
  },
  {
    level: 2,
    title: 'Intermediate',
    description: 'Moderate vocabulary, medium-length sentences, varied topics',
    icon: GraduationCap,
    color: 'text-blue-600',
  },
  {
    level: 3,
    title: 'Advanced',
    description: 'Complex vocabulary, longer sentences, abstract topics',
    icon: Trophy,
    color: 'text-purple-600',
  },
];

export function DifficultySelector({ onStart, isLoading = false }: DifficultySelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('1');

  const handleStart = () => {
    onStart(parseInt(selectedLevel));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Choose Difficulty Level</CardTitle>
          <CardDescription>
            Select a difficulty level to start your English-Urdu translation practice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedLevel} onValueChange={setSelectedLevel}>
            <div className="grid gap-4 md:grid-cols-3">
              {DIFFICULTY_LEVELS.map((difficulty) => {
                const Icon = difficulty.icon;
                const isSelected = selectedLevel === difficulty.level.toString();

                return (
                  <div key={difficulty.level} className="relative">
                    <RadioGroupItem
                      value={difficulty.level.toString()}
                      id={`level-${difficulty.level}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`level-${difficulty.level}`}
                      className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`h-6 w-6 ${difficulty.color}`} />
                        <span className="font-semibold text-lg">{difficulty.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{difficulty.description}</p>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          <div className="flex justify-end">
            <Button
              onClick={handleStart}
              size="lg"
              disabled={isLoading}
              className="min-w-[150px]"
            >
              {isLoading ? 'Starting...' : 'Start Practice'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
