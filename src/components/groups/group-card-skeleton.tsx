"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GroupCardSkeleton() {
  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        <Skeleton className="h-4 w-2/5 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <Skeleton className="h-4 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-px w-full" />
          <div className="space-y-2 pt-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
