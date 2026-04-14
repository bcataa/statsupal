"use client";

import { useCallback, useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className,
  disabled,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    if (disabled) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [disabled, text]);

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      disabled={disabled}
      className={className}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
