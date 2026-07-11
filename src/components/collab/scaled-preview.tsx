"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders children at a reduced scale WITHOUT the leftover whitespace a plain
 * CSS transform leaves behind: the wrapper measures the content and sets its
 * own height to match the scaled size.
 */
export function ScaledPreview({
  scale = 0.55,
  className,
  children,
}: {
  scale?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    const measure = () => setHeight(node.offsetHeight * scale);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [scale]);

  return (
    <div
      className={className}
      style={{ height: height ?? undefined, overflow: "hidden" }}
    >
      <div
        ref={innerRef}
        style={{
          width: `${100 / scale}%`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
