import { writable, get } from "svelte/store";
import type { TodoList, UUID } from "$lib/memory/types";
import { ListRepository } from "$lib/memory/list-repository";

export interface ListState {
  lists: TodoList[];
  selectedListId: UUID | null;
  loading: boolean;
  error: string | null;
}

const initialState: ListState = {
  lists: [],
  selectedListId: null,
  loading: false,
  error: null,
};

export class ListStore {
  private readonly state = writable<ListState>(initialState);

  constructor(
    private readonly householdId: UUID,
    private readonly repository: Pick<
      ListRepository,
      "getLists" | "createList" | "deleteList"
    >,
  ) {}

  subscribe = this.state.subscribe;

  private setError(error: unknown): void {
    this.state.update((current) => ({
      ...current,
      loading: false,
      error: error instanceof Error ? error.message : "Unexpected list error",
    }));
  }

  async load(): Promise<void> {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const lists = await this.repository.getLists(this.householdId);
      this.state.update((current) => ({
        ...current,
        lists,
        loading: false,
        selectedListId:
          current.selectedListId &&
          lists.some((list) => list.id === current.selectedListId)
            ? current.selectedListId
            : (lists[0]?.id ?? null),
      }));
    } catch (error) {
      this.setError(error);
    }
  }

  async create(title: string): Promise<void> {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const created = await this.repository.createList(this.householdId, title);
      this.state.update((current) => ({
        ...current,
        loading: false,
        lists: [...current.lists, created].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
        ),
        selectedListId: created.id,
      }));
    } catch (error) {
      this.setError(error);
    }
  }

  async remove(listId: UUID): Promise<void> {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      await this.repository.deleteList(listId, this.householdId);
      this.state.update((current) => {
        const lists = current.lists.filter((list) => list.id !== listId);
        const selectedListId =
          current.selectedListId === listId
            ? (lists[0]?.id ?? null)
            : current.selectedListId;

        return {
          ...current,
          loading: false,
          lists,
          selectedListId,
        };
      });
    } catch (error) {
      this.setError(error);
    }
  }

  select(listId: UUID): void {
    this.state.update((current) => ({
      ...current,
      selectedListId: current.lists.some((list) => list.id === listId)
        ? listId
        : current.selectedListId,
    }));
  }

  setLists(lists: TodoList[]): void {
    this.state.update((current) => ({
      ...current,
      lists,
      selectedListId:
        current.selectedListId &&
        lists.some((list) => list.id === current.selectedListId)
          ? current.selectedListId
          : (lists[0]?.id ?? null),
    }));
  }

  getSnapshot(): ListState {
    return get(this.state);
  }
}
