import type { TodoItem } from '$lib/memory/types';
import { toSortText } from '$lib/utils/item-text';

export function compareItemsForDisplay(a: TodoItem, b: TodoItem): number {
  if (a.isCompleted !== b.isCompleted) {
    return a.isCompleted ? 1 : -1;
  }

  const byText = toSortText(a.description).localeCompare(toSortText(b.description));
  if (byText !== 0) {
    return byText;
  }

  const byCreated = a.createdAt.localeCompare(b.createdAt);
  if (byCreated !== 0) {
    return byCreated;
  }

  return a.id.localeCompare(b.id);
}

export function sortItemsForDisplay(items: TodoItem[]): TodoItem[] {
  return items.slice().sort(compareItemsForDisplay);
}
