import * as React from "react";

export function BrazilFlagIcon({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  const clipId = React.useId();

  return (
    <svg
      viewBox="0 0 24 16"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="24" height="16" rx="2" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="24" height="16" fill="var(--flag-br-green)" />
        <polygon
          points="12,2.1 21.6,8 12,13.9 2.4,8"
          fill="var(--flag-br-yellow)"
        />
        <circle cx="12" cy="8" r="3.4" fill="var(--flag-br-blue)" />
        <path
          d="M8.8 7.55C10.8 6.85 13.2 7.25 15.2 8.55"
          stroke="var(--flag-br-white)"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

const US_RED_STRIPES_Y = [0, 2.46, 4.92, 7.38, 9.85, 12.31, 14.77] as const;

const US_STAR_POSITIONS: ReadonlyArray<{ cx: number; cy: number }> = [
  { cx: 1.7, cy: 1.5 },
  { cx: 4.1, cy: 1.5 },
  { cx: 6.5, cy: 1.5 },
  { cx: 8.9, cy: 1.5 },
  { cx: 2.9, cy: 3.1 },
  { cx: 5.3, cy: 3.1 },
  { cx: 7.7, cy: 3.1 },
  { cx: 1.7, cy: 4.7 },
  { cx: 4.1, cy: 4.7 },
  { cx: 6.5, cy: 4.7 },
  { cx: 8.9, cy: 4.7 },
  { cx: 2.9, cy: 6.3 },
  { cx: 5.3, cy: 6.3 },
  { cx: 7.7, cy: 6.3 },
];

export function UsFlagIcon({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  const clipId = React.useId();

  return (
    <svg
      viewBox="0 0 24 16"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="24" height="16" rx="2" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="24" height="16" fill="var(--flag-us-white)" />
        {US_RED_STRIPES_Y.map((y) => (
          <rect
            key={y}
            x="0"
            y={y}
            width="24"
            height="1.23"
            fill="var(--flag-us-red)"
          />
        ))}
        <rect x="0" y="0" width="10.6" height="8.62" fill="var(--flag-us-blue)" />
        {US_STAR_POSITIONS.map((star, index) => (
          <circle
            key={index}
            cx={star.cx}
            cy={star.cy}
            r="0.45"
            fill="var(--flag-us-white)"
          />
        ))}
      </g>
    </svg>
  );
}
