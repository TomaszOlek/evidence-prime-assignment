import { useState, useRef, type JSX, useMemo } from "react";
import "./App.css";

/**
 * Types
 */
type GridPoint = [number, number];
type RuneMap = Record<number, GridPoint[]>;

type DigitPosition = {
  flipX: boolean;
  flipY: boolean;
  keyPrefix: string;
};

/**
 * Constants
 */
const BASE_RUNE_COORDINATES: RuneMap = {
  1: [
    [1, 0],
    [2, 0],
  ],
  2: [
    [1, 1],
    [2, 1],
  ],
  3: [
    [1, 0],
    [2, 1],
  ],
  4: [
    [1, 1],
    [2, 0],
  ],
  5: [
    [1, 1],
    [2, 0],
    [1, 0],
  ],
  6: [
    [2, 0],
    [2, 1],
  ],
  7: [
    [1, 0],
    [2, 0],
    [2, 1],
  ],
  8: [
    [1, 1],
    [2, 1],
    [2, 0],
  ],
  9: [
    [1, 1],
    [2, 1],
    [2, 0],
    [1, 0],
  ],
};

const CELL_SIZE = 50;
const PADDING = 20;
const RUNE_STROKE = 4;

const GRID_WIDTH = 2;
const GRID_HEIGHT = 3;

const RUNE_MIN_VALUE = 1;
const RUNE_MAX_VALUE = 9999;

/**
 * Helpers
 */
function gridToSvg([x, y]: GridPoint): { x: number; y: number } {
  return {
    x: PADDING + x * CELL_SIZE,
    y: PADDING + y * CELL_SIZE,
  };
}

function flipY([x, y]: GridPoint): GridPoint {
  return [GRID_WIDTH - x, y];
}

function flipX([x, y]: GridPoint): GridPoint {
  return [x, GRID_HEIGHT - y];
}

function generateDigitLines(
  digit: number,
  flipXFlag: boolean,
  flipYFlag: boolean,
  keyPrefix: string,
): JSX.Element[] {
  let points = BASE_RUNE_COORDINATES[digit] ?? [];
  if (flipXFlag) points = points.map(flipX);
  if (flipYFlag) points = points.map(flipY);

  return points.slice(0, points.length - 1).map((_, i) => {
    const a = gridToSvg(points[i]);
    const b = gridToSvg(points[i + 1]);
    return (
      <line
        key={`${keyPrefix}-${i}`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="black"
        strokeWidth={RUNE_STROKE}
        strokeLinecap="round"
      />
    );
  });
}

function generateRuneLines(value: number): JSX.Element[] {
  if (value < RUNE_MIN_VALUE || value > RUNE_MAX_VALUE) return [];

  const digits = value.toString().padStart(4, "0").split("").map(Number);

  const positions: DigitPosition[] = [
    { flipX: true, flipY: true, keyPrefix: "thousands" },
    { flipX: true, flipY: false, keyPrefix: "hundreds" },
    { flipX: false, flipY: true, keyPrefix: "tens" },
    { flipX: false, flipY: false, keyPrefix: "ones" },
  ];

  return digits
    .map((digit, i) => {
      if (digit === 0) return [];

      const { flipX, flipY, keyPrefix } = positions[i];
      return generateDigitLines(digit, flipX, flipY, keyPrefix);
    })
    .flat();
}

/**
 * App
 */
function App() {
  const [value, setValue] = useState<number>(1);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const runeLines = useMemo(() => generateRuneLines(value), [value]);

  const downloadSVG = () => {
    if (!svgRef.current) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);

    const blob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rune-${value}.svg`;
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className="wrapper">
      <div className="input-wrapper">
        <label htmlFor="number-input">Enter a number (1–9999)</label>
        <input
          id="number-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          min={RUNE_MIN_VALUE}
          max={RUNE_MAX_VALUE}
          value={value === 0 ? "" : value}
          onChange={(e) => {
            const val = e.target.value;
            if (!/^\d*$/.test(val)) return;

            if (val === "") {
              setValue(0);
              return;
            }

            const num = Math.floor(Number(val));

            if (num < RUNE_MIN_VALUE) setValue(RUNE_MIN_VALUE);
            else if (num > RUNE_MAX_VALUE) setValue(RUNE_MAX_VALUE);
            else setValue(num);
          }}
          onBlur={() => {
            if (!value) setValue(RUNE_MIN_VALUE);
          }}
        />
      </div>

      <div className="svg-wrapper">
        <svg
          ref={svgRef}
          width="140"
          height="200"
          viewBox="0 0 140 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1={PADDING + 1 * CELL_SIZE}
            y1={PADDING + 0 * CELL_SIZE}
            x2={PADDING + 1 * CELL_SIZE}
            y2={PADDING + 3 * CELL_SIZE}
            stroke="black"
            strokeWidth={4}
            strokeLinecap="round"
          />

          {runeLines}
        </svg>
      </div>

      <button onClick={downloadSVG}>Download SVG</button>
    </div>
  );
}

export default App;
