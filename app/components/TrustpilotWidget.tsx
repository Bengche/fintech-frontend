"use client";

import { useEffect, useRef } from "react";

/**
 * Renders the Trustpilot Review Collector widget.
 *
 * After Next.js hydrates the page the widget div may already exist in the
 * DOM without Trustpilot's script having processed it, so we call
 * Trustpilot.loadFromElement() on mount to ensure the iframe is injected.
 */
export default function TrustpilotWidget() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tp = (window as unknown as { Trustpilot?: { loadFromElement: (el: Element | null, force?: boolean) => void } }).Trustpilot;
    if (tp) {
      tp.loadFromElement(ref.current, true);
    }
  }, []);

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="en-US"
      data-template-id="56278e9abfbbba0bdcd568bc"
      data-businessunit-id="6a31f994e10624a15deb0780"
      data-style-height="52px"
      data-style-width="100%"
      data-token="6e6758e6-a03a-4397-b630-035d04924fdc"
    >
      <a
        href="https://www.trustpilot.com/review/fonlok.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}
