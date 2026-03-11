"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function JobError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error) {
      // Show user-facing error message via toast
      const message = error.message || "Failed to load job. Please try again.";
      toast.error(message, {
        description: error.digest ? `Error ID: ${error.digest}` : undefined,
      });
    }
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
