import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '$lib/supabase/client';
import {
  CREATE_ITEM,
  CREATE_LIST,
  DELETE_ITEM,
  DELETE_LIST,
  GET_CHANGES_SINCE,
  GET_ITEMS_BY_LIST,
  GET_LISTS,
  SET_ITEM_COMPLETION,
  UPDATE_ITEM_TEXT
} from '$lib/graphql/operations';

type RequestVariables = Record<string, unknown>;

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export class SupabaseDataClient {
  constructor(private readonly client: SupabaseClient | null = getSupabaseClient()) {}

  async request<TData>(operation: string, variables: RequestVariables = {}): Promise<TData> {
    if (!operation.trim()) {
      throw new Error('Data request failed: operation is required');
    }

    if (!this.client) {
      throw new Error('Supabase client is not configured');
    }

    switch (operation) {
      case GET_LISTS:
        return this.getLists(variables) as Promise<TData>;
      case GET_ITEMS_BY_LIST:
        return this.getItemsByList(variables) as Promise<TData>;
      case CREATE_LIST:
        return this.createList(variables) as Promise<TData>;
      case DELETE_LIST:
        return this.deleteList(variables) as Promise<TData>;
      case CREATE_ITEM:
        return this.createItem(variables) as Promise<TData>;
      case UPDATE_ITEM_TEXT:
        return this.updateItemText(variables) as Promise<TData>;
      case SET_ITEM_COMPLETION:
        return this.setItemCompletion(variables) as Promise<TData>;
      case DELETE_ITEM:
        return this.deleteItem(variables) as Promise<TData>;
      case GET_CHANGES_SINCE:
        return this.getChangesSince(variables) as Promise<TData>;
      default:
        throw new Error(`Data request failed: unsupported operation ${operation}`);
    }
  }

  private async getLists(variables: RequestVariables): Promise<unknown> {
    const householdId = asString(variables.householdId);
    const { data, error } = await this.client!
      .from('todo_lists')
      .select('id, household_id, title, sort_order, created_at, updated_at, deleted_at')
      .eq('household_id', householdId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return { todo_lists: data ?? [] };
  }

  private async getItemsByList(variables: RequestVariables): Promise<unknown> {
    const listId = asString(variables.listId);
    const { data, error } = await this.client!
      .from('todo_items')
      .select('id, household_id, list_id, description, is_completed, completed_at, created_at, updated_at, deleted_at')
      .eq('list_id', listId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return { todo_items: data ?? [] };
  }

  private async createList(variables: RequestVariables): Promise<unknown> {
    const householdId = asString(variables.householdId);
    const title = asString(variables.title);
    const sortOrder = asNumber(variables.sortOrder);

    const { data, error } = await this.client!
      .from('todo_lists')
      .insert({ household_id: householdId, title, sort_order: sortOrder })
      .select('id, household_id, title, sort_order, created_at, updated_at, deleted_at')
      .single();

    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return { insert_todo_lists_one: data };
  }

  private async deleteList(variables: RequestVariables): Promise<unknown> {
    const listId = asString(variables.listId);
    const deletedAt = asString(variables.deletedAt, new Date().toISOString());

    const { data, error } = await this.client!
      .from('todo_lists')
      .update({ deleted_at: deletedAt })
      .eq('id', listId)
      .select('id, deleted_at')
      .maybeSingle();

    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return { update_todo_lists_by_pk: data ?? null };
  }

  private async createItem(variables: RequestVariables): Promise<unknown> {
    const listId = asString(variables.listId);
    const description = asString(variables.description);
    const householdId = asString(variables.householdId);

    const { data, error } = await this.client!
      .from('todo_items')
      .insert({ list_id: listId, household_id: householdId, description, is_completed: false })
      .select('id, household_id, list_id, description, is_completed, completed_at, created_at, updated_at, deleted_at')
      .single();

    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return { insert_todo_items_one: data };
  }

  private async updateItemText(variables: RequestVariables): Promise<unknown> {
    const itemId = asString(variables.itemId);
    const description = asString(variables.description);
    const expectedUpdatedAt = asString(variables.expectedUpdatedAt);

    let query = this.client!
      .from('todo_items')
      .update({ description })
      .eq('id', itemId);

    if (expectedUpdatedAt) {
      query = query.eq('updated_at', expectedUpdatedAt);
    }

    const { data, error } = await query
      .select('id, household_id, list_id, description, is_completed, completed_at, created_at, updated_at, deleted_at')
      .maybeSingle();

    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return { update_todo_items_by_pk: data ?? null };
  }

  private async setItemCompletion(variables: RequestVariables): Promise<unknown> {
    const itemId = asString(variables.itemId);
    const isCompleted = asBoolean(variables.isCompleted);
    const completedAt = isCompleted ? asString(variables.completedAt, new Date().toISOString()) : null;
    const expectedUpdatedAt = asString(variables.expectedUpdatedAt);

    let query = this.client!
      .from('todo_items')
      .update({ is_completed: isCompleted, completed_at: completedAt })
      .eq('id', itemId);

    if (expectedUpdatedAt) {
      query = query.eq('updated_at', expectedUpdatedAt);
    }

    const { data, error } = await query
      .select('id, household_id, list_id, description, is_completed, completed_at, created_at, updated_at, deleted_at')
      .maybeSingle();

    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return { update_todo_items_by_pk: data ?? null };
  }

  private async deleteItem(variables: RequestVariables): Promise<unknown> {
    const itemId = asString(variables.itemId);
    const deletedAt = asString(variables.deletedAt, new Date().toISOString());
    const expectedUpdatedAt = asString(variables.expectedUpdatedAt);

    let query = this.client!
      .from('todo_items')
      .update({ deleted_at: deletedAt })
      .eq('id', itemId);

    if (expectedUpdatedAt) {
      query = query.eq('updated_at', expectedUpdatedAt);
    }

    const { data, error } = await query.select('id, deleted_at').maybeSingle();
    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return { update_todo_items_by_pk: data ?? null };
  }

  private async getChangesSince(variables: RequestVariables): Promise<unknown> {
    const householdId = asString(variables.householdId);
    const since = asString(variables.since);

    const { data: changedLists, error: listError } = await this.client!
      .from('todo_lists')
      .select('id, household_id, title, sort_order, created_at, updated_at, deleted_at')
      .eq('household_id', householdId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (listError) throw new Error(`Supabase request failed: ${listError.message}`);

    const { data: changedItems, error: itemError } = await this.client!
      .from('todo_items')
      .select('id, household_id, list_id, description, is_completed, completed_at, created_at, updated_at, deleted_at')
      .eq('household_id', householdId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (itemError) throw new Error(`Supabase request failed: ${itemError.message}`);

    return {
      changedLists: changedLists ?? [],
      changedItems: changedItems ?? []
    };
  }
}

export const hasuraClient = hasuraConfigured() ? new SupabaseDataClient() : null;

export type HasuraClient = SupabaseDataClient;

export function hasuraConfigured(): boolean {
  return Boolean(getSupabaseClient());
}
