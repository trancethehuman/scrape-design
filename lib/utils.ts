import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips markdown code block markers from generated code text
 *
 * Removes common formats like:
 * ```jsx
 * code here
 * ```
 *
 * ```typescript
 * code here
 * ```
 *
 * @param codeText The possibly marked up code from AI generation
 * @returns Clean code without markdown markers
 */
export function stripCodeBlockMarkers(codeText: string): string {
  // Return empty string if input is null or undefined
  if (!codeText) return "";

  // Remove opening code block markers (```language)
  const withoutOpeningMarker = codeText.replace(/^```[\w-]*\n/m, "");

  // Remove closing code block markers (```)
  const withoutCodeMarkers = withoutOpeningMarker.replace(/\n```\s*$/m, "");

  return withoutCodeMarkers;
}
