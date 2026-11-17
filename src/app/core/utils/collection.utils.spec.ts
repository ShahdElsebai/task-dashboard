import { patchById, removeById, replaceById, restoreById } from './collection.utils';

type Item = { id: string; v: number };
const items: Item[] = [
  { id: 'a', v: 1 },
  { id: 'b', v: 2 },
];

describe('collection utils', () => {
  it('replaceById / removeById', () => {
    expect(replaceById(items, 'b', { id: 'b', v: 9 })[1].v).toBe(9);
    expect(removeById(items, 'a').map((i: Item) => i.id)).toEqual(['b']);
  });

  it('patchById merges only the given items', () => {
    expect(patchById<Item>(items, new Map([['a', { v: 5 }]]))).toEqual([
      { id: 'a', v: 5 },
      { id: 'b', v: 2 },
    ]);
  });

  it('restoreById replaces changed items and re-adds removed ones', () => {
    const changed: Item[] = [{ id: 'a', v: 100 }];
    expect(restoreById(changed, items)).toEqual(items);
  });

  it('does not mutate the input', () => {
    patchById<Item>(items, new Map([['a', { v: 5 }]]));
    expect(items[0].v).toBe(1);
  });
});
