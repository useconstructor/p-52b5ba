export type Item = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

// Module-level in-memory store — demo only, resets on cold start
const store = new Map<string, Item>([
  [
    "1",
    {
      id: "1",
      name: "Item One",
      description: "First example item",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "2",
    {
      id: "2",
      name: "Item Two",
      description: "Second example item",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

let nextId = 3;

export function listItems(): Item[] {
  return Array.from(store.values());
}

export function getItem(id: string): Item | undefined {
  return store.get(id);
}

export function createItem(data: { name: string; description: string }): Item {
  const id = String(nextId++);
  const now = new Date().toISOString();
  const item: Item = { id, ...data, createdAt: now, updatedAt: now };
  store.set(id, item);
  return item;
}

export function replaceItem(
  id: string,
  data: { name: string; description: string }
): Item | null {
  if (!store.has(id)) return null;
  const item: Item = {
    id,
    ...data,
    createdAt: store.get(id)!.createdAt,
    updatedAt: new Date().toISOString(),
  };
  store.set(id, item);
  return item;
}

export function patchItem(
  id: string,
  data: Partial<{ name: string; description: string }>
): Item | null {
  const existing = store.get(id);
  if (!existing) return null;
  const item: Item = { ...existing, ...data, updatedAt: new Date().toISOString() };
  store.set(id, item);
  return item;
}

export function deleteItem(id: string): boolean {
  return store.delete(id);
}
