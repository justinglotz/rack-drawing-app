import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FlexUrlForm from "@/components/forms/FlexUrlForm";
import React from "react";

export default function ImportPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white font-sans">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Jobs
      </Link>
      <FlexUrlForm />
    </div>
  );
}
