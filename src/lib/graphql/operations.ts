export const LIST_FIELDS = `
  id
  household_id
  title
  sort_order
  created_at
  updated_at
  deleted_at
`;

export const ITEM_FIELDS = `
  id
  list_id
  description
  is_completed
  completed_at
  created_at
  updated_at
  deleted_at
`;

export const GET_LISTS = `
  query GetLists($householdId: uuid!) {
    todo_lists(
      where: { household_id: { _eq: $householdId }, deleted_at: { _is_null: true } }
      order_by: [{ sort_order: asc }, { created_at: asc }]
    ) {
      ${LIST_FIELDS}
    }
  }
`;

export const GET_ITEMS_BY_LIST = `
  query GetItemsByList($listId: uuid!) {
    todo_items(
      where: { list_id: { _eq: $listId }, deleted_at: { _is_null: true } }
      order_by: [{ created_at: asc }]
    ) {
      ${ITEM_FIELDS}
    }
  }
`;

export const CREATE_LIST = `
  mutation CreateList($householdId: uuid!, $title: String!, $sortOrder: Int!) {
    insert_todo_lists_one(
      object: { household_id: $householdId, title: $title, sort_order: $sortOrder }
    ) {
      ${LIST_FIELDS}
    }
  }
`;

export const DELETE_LIST = `
  mutation DeleteList($listId: uuid!, $deletedAt: timestamptz!) {
    update_todo_lists_by_pk(
      pk_columns: { id: $listId }
      _set: { deleted_at: $deletedAt }
    ) {
      id
      deleted_at
    }
  }
`;

export const CREATE_ITEM = `
  mutation CreateItem($listId: uuid!, $description: String!) {
    insert_todo_items_one(
      object: { list_id: $listId, description: $description, is_completed: false }
    ) {
      ${ITEM_FIELDS}
    }
  }
`;

export const UPDATE_ITEM_TEXT = `
  mutation UpdateItemText($itemId: uuid!, $description: String!) {
    update_todo_items_by_pk(
      pk_columns: { id: $itemId }
      _set: { description: $description }
    ) {
      ${ITEM_FIELDS}
    }
  }
`;

export const SET_ITEM_COMPLETION = `
  mutation SetItemCompletion($itemId: uuid!, $isCompleted: Boolean!, $completedAt: timestamptz) {
    update_todo_items_by_pk(
      pk_columns: { id: $itemId }
      _set: { is_completed: $isCompleted, completed_at: $completedAt }
    ) {
      ${ITEM_FIELDS}
    }
  }
`;

export const DELETE_ITEM = `
  mutation DeleteItem($itemId: uuid!, $deletedAt: timestamptz!) {
    update_todo_items_by_pk(
      pk_columns: { id: $itemId }
      _set: { deleted_at: $deletedAt }
    ) {
      id
      deleted_at
    }
  }
`;

export const GET_CHANGES_SINCE = `
  query GetChangesSince($householdId: uuid!, $since: timestamptz!) {
    changedLists: todo_lists(
      where: {
        household_id: { _eq: $householdId }
        updated_at: { _gt: $since }
      }
      order_by: [{ updated_at: asc }]
    ) {
      ${LIST_FIELDS}
    }
    changedItems: todo_items(
      where: {
        todo_list: { household_id: { _eq: $householdId } }
        updated_at: { _gt: $since }
      }
      order_by: [{ updated_at: asc }]
    ) {
      ${ITEM_FIELDS}
    }
  }
`;
