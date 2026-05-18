// components/atoms/ChromaImg.tsx — <img> for greenscreen puppet assets:
// loads, chroma-keys, then shows the transparent result. AGENT: Frontend.
import { useEffect, useState, type CSSProperties } from "react";
import { chromaUrl } from "@/lib/chroma";

interface ChromaImgProps {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

export function ChromaImg({ src, alt = "", className, style }: ChromaImgProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    chromaUrl(src)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(src)); // fall back to raw on failure
    return () => {
      alive = false;
    };
  }, [src]);

  return (
    <img
      className={className}
      style={{ ...style, opacity: url ? undefined : 0 }}
      src={url ?? undefined}
      alt={alt}
    />
  );
}
