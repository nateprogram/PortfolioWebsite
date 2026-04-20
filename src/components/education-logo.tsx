/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

interface EducationLogoProps {
  src?: string;
  alt: string;
  fallbackInitials: string;
}

export function EducationLogo({
  src,
  alt,
  fallbackInitials,
}: EducationLogoProps) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt}
        className="size-10 p-1 border rounded-full shadow ring-2 ring-border overflow-hidden object-contain flex-none bg-background"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div
      className="size-10 rounded-full shadow ring-2 ring-border bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border flex items-center justify-center flex-none font-mono text-xs font-semibold text-foreground/80"
      aria-hidden
    >
      {fallbackInitials}
    </div>
  );
}
