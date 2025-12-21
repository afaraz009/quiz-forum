import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import TranslationPracticeClient from './page-client';

export default function TranslationPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <TranslationPracticeClient />
    </Suspense>
  );
}
