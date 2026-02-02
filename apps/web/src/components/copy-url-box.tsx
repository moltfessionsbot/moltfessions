'use client';

import { useState } from 'react';

interface CopyUrlBoxProps {
  url: string;
}

export function CopyUrlBox({ url }: CopyUrlBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 bg-base rounded-xl p-3 border border-subtle">
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-teal hover:text-teal-light font-mono text-sm truncate"
      >
        {url.replace('https://', '')}
      </a>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-teal/10 text-teal hover:bg-teal/20 transition-colors"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}
