"use client";

import { useEffect } from "react";

export default function JobError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Failed to load job</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "Something went wrong. Please try again."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
