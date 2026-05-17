// components/layout/NavHeader.tsx — top bar with back + title + right slot.
// AGENT: Frontend. From shared.jsx NavHeader.
import type { ReactNode } from "react";
import { BackBtn } from "@/components/atoms/misc";

interface NavHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function NavHeader({ title, onBack, right }: NavHeaderProps) {
  return (
    <div className="c-navheader">
      <div className="c-navheader__slot">
        {onBack && <BackBtn onClick={onBack} />}
      </div>
      <div className="c-navheader__title">{title}</div>
      <div className="c-navheader__slot c-navheader__slot--right">{right}</div>
    </div>
  );
}
