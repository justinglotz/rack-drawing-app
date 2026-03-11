"use client";

import * as z from "zod";
import { useState, useRef, useEffect } from "react";
import { useForm } from "@tanstack/react-form-nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useImportFlexUrl } from "@/hooks/useFlex";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  url: z.url("Please enter a valid URL"),
});

export default function FlexUrlForm() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { mutate, isPending } = useImportFlexUrl();
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const isOverlayVisible = isPending || isRedirecting;

    if (isOverlayVisible) {
      // Save the currently focused element before showing overlay
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus the overlay to trap focus
      overlayRef.current?.focus();
    } else if (previousActiveElement.current) {
      // Restore focus to the previously focused element
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isPending, isRedirecting]);

  // Trap focus within the overlay (prevent Tab from escaping)
  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      // Keep focus trapped on the overlay by preventing default and re-focusing
      e.preventDefault();
      overlayRef.current?.focus();
    }
  };

  const form = useForm({
    defaultValues: {
      url: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      mutate(value.url, {
        onSuccess: (response) => {
          if (!response?.data?.id) {
            toast.error("Invalid response from server");
            return;
          }
          try {
            setIsRedirecting(true);
            router.push(`/job/${response.data.id}`);
          } catch {
            setIsRedirecting(false);
            toast.error("Navigation failed");
          }
        },
        onError: () => {
          setIsRedirecting(false);
        },
      });
    },
  });
  return (
    <>
      {(isPending || isRedirecting) && (
        <div
          ref={overlayRef}
          tabIndex={-1}
          onKeyDown={handleOverlayKeyDown}
          className="fixed inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loading-message"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin" aria-hidden="true" />
            <p id="loading-message" className="text-lg font-medium" aria-live="polite">
              Importing your data...
            </p>
          </div>
        </div>
      )}
      <Card className="w-full sm:max-w-md" aria-hidden={isPending || isRedirecting}>
      <CardHeader>
        <CardTitle>Import Flex Data</CardTitle>
        <CardDescription>Import Data from Flex Pullsheet</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="flex-import-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="url"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Flex Pullsheet URL
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Enter URL"
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="submit" form="flex-import-form" disabled={isPending || isRedirecting}>
            {isPending ? "Importing..." : isRedirecting ? "Redirecting..." : "Submit"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
    </>
  );
}
