import type { KeyboardEvent } from "react";

/**
 * Enter-to-advance keyboard navigation for forms. Attach to a <form>'s onKeyDown:
 * pressing Enter in an input moves focus to the next focusable input instead of
 * submitting; on the last input, Enter falls through to the browser's native
 * implicit submit (so the form's onSubmit + validation run unchanged).
 */
export function advanceOnEnter(e: KeyboardEvent<HTMLFormElement>): void {
  if (e.key !== "Enter") return;
  // Don't hijack IME composition (e.g. selecting a candidate with Enter).
  if (e.nativeEvent.isComposing) return;

  const target = e.target as HTMLElement;
  // Only act on single-line inputs; leave buttons/textareas to behave natively.
  if (target.tagName !== "INPUT") return;

  const fields = Array.from(
    e.currentTarget.querySelectorAll<HTMLInputElement>(
      "input:not([type='hidden']):not([disabled])",
    ),
  ).filter((el) => el.tabIndex !== -1);

  const index = fields.indexOf(target as HTMLInputElement);
  if (index === -1 || index === fields.length - 1) return; // last field → native submit

  e.preventDefault();
  fields[index + 1].focus();
}
