import type { TodoItem } from "$lib/memory/types";
import { normalizeItemText } from "$lib/utils/item-text";

export interface ItemMatch {
  item: TodoItem;
  score: number;
  isStrongMatch: boolean;
}

function tokenOverlapScore(a: string, b: string): number {
  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}

function scoreTextMatch(
  draftNormalized: string,
  itemNormalized: string,
): number {
  if (!draftNormalized || !itemNormalized) {
    return 0;
  }

  if (draftNormalized === itemNormalized) {
    return 1;
  }

  if (
    itemNormalized.startsWith(draftNormalized) ||
    draftNormalized.startsWith(itemNormalized)
  ) {
    return 0.9;
  }

  if (
    itemNormalized.includes(draftNormalized) ||
    draftNormalized.includes(itemNormalized)
  ) {
    return 0.75;
  }

  const overlap = tokenOverlapScore(draftNormalized, itemNormalized);
  return overlap >= 0.5 ? 0.6 : overlap;
}

export function getItemMatches(
  draft: string,
  items: TodoItem[],
  limit = 5,
): ItemMatch[] {
  const normalizedDraft = normalizeItemText(draft);
  if (!normalizedDraft) {
    return [];
  }

  return items
    .filter((item) => !item.deletedAt)
    .map((item) => {
      const normalizedItem = normalizeItemText(item.description);
      const score = scoreTextMatch(normalizedDraft, normalizedItem);
      return {
        item,
        score,
        isStrongMatch: score >= 0.9,
      };
    })
    .filter((match) => match.score >= 0.4)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.description.localeCompare(b.item.description),
    )
    .slice(0, limit);
}
