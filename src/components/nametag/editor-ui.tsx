import type { SVGProps } from "react";

export const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-red-800 focus:ring-2 focus:ring-red-800/10";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40";

const paths = {
  badge:
    "M9 3h6v4H9z M9 5H5v16h14V5h-4 M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0 M8 19c0-4 8-4 8 0",
  upload: "M12 16V3 M7 8l5-5 5 5 M4 16v5h16v-5",
  camera: "M4 6h4l2-3h4l2 3h4v14H4z M8 13a4 4 0 1 0 8 0 4 4 0 0 0-8 0",
  download: "M12 3v13 M7 11l5 5 5-5 M4 17v4h16v-4",
  check: "m5 12 4 4L19 6",
  reset: "M3 10a9 9 0 1 1 2 8 M3 3v7h7",
} as const;

type EditorIconProps = SVGProps<SVGSVGElement> & {
  name: keyof typeof paths;
};

export function EditorIcon({ name, ...props }: EditorIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
