"use client";

interface ScoreGaugeProps {
  score: number;
  label?: string;
}

function getScoreColour(score: number): string {
  if (score < 40) return "#dc2626";
  if (score <= 70) return "#d97706";
  return "#16a34a";
}

export function ScoreGauge({ score, label }: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const colour = getScoreColour(clampedScore);

  // Semicircular gauge using SVG arc
  const radius = 80;
  const strokeWidth = 10;
  const cx = 100;
  const cy = 100;

  // Arc from 180deg to 0deg (left to right, semicircle)
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = startAngle - (startAngle - endAngle) * (clampedScore / 100);

  const bgStartX = cx + radius * Math.cos(startAngle);
  const bgStartY = cy - radius * Math.sin(startAngle);
  const bgEndX = cx + radius * Math.cos(endAngle);
  const bgEndY = cy - radius * Math.sin(endAngle);

  const arcEndX = cx + radius * Math.cos(sweepAngle);
  const arcEndY = cy - radius * Math.sin(sweepAngle);

  const largeArcFlag = clampedScore > 50 ? 1 : 0;

  const bgPath = `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`;
  const scorePath =
    clampedScore === 0
      ? ""
      : `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${arcEndX} ${arcEndY}`;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="w-56 sm:w-64"
        aria-label={`Clarity score: ${clampedScore} out of 100`}
      >
        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Score arc */}
        {scorePath && (
          <path
            d={scorePath}
            fill="none"
            stroke={colour}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Score number */}
        <text
          x={cx}
          y={95}
          textAnchor="middle"
          className="font-sans"
          style={{
            fontSize: "48px",
            fontWeight: 700,
            fill: colour,
          }}
        >
          {clampedScore}
        </text>
        {/* /100 indicator */}
        <text
          x={cx}
          y={115}
          textAnchor="middle"
          className="font-sans"
          style={{
            fontSize: "14px",
            fontWeight: 400,
            fill: "#a1a1aa",
          }}
        >
          / 100
        </text>
      </svg>
      {label && (
        <p className="mt-1 text-sm font-medium tracking-wide text-zinc-500 uppercase">
          {label}
        </p>
      )}
    </div>
  );
}
