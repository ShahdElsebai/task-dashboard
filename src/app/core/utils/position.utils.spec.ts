import {
  POSITION_GAP,
  byPosition,
  planMove,
  positionAfterLast,
  positionBetween,
  rebalance,
  toFullIndex,
} from './position.utils';

const list = (...positions: number[]): { id: string; position: number }[] =>
  positions.map((position: number, i: number) => ({ id: `item-${i + 1}`, position }));

describe('position utils', () => {
  describe('positionBetween', () => {
    it('starts an empty list at the gap', () => {
      expect(positionBetween(null, null)).toBe(POSITION_GAP);
    });

    it('appends one gap after the last item', () => {
      expect(positionBetween(3000, null)).toBe(4000);
    });

    it('halves the first position when dropped at the start', () => {
      expect(positionBetween(null, 1000)).toBe(500);
    });

    it('returns the midpoint between neighbours', () => {
      expect(positionBetween(1000, 2000)).toBe(1500);
      expect(positionBetween(1000, 1500)).toBe(1250);
    });

    it('returns null when no integer is left between neighbours', () => {
      expect(positionBetween(1000, 1001)).toBeNull();
      expect(positionBetween(null, 1)).toBeNull();
    });
  });

  describe('planMove', () => {
    it('updates only the moved item when there is room', () => {
      expect(planMove(list(1000, 2000, 3000), 'item-3', 1)).toEqual([{ id: 'item-3', position: 1500 }]);
    });

    it('moves to the end of another list', () => {
      expect(planMove(list(1000, 2000), 'new', 2)).toEqual([{ id: 'new', position: 3000 }]);
    });

    it('moves into an empty list', () => {
      expect(planMove([], 'new', 0)).toEqual([{ id: 'new', position: 1000 }]);
    });

    it('clamps an out-of-range index to the end', () => {
      expect(planMove(list(1000), 'new', 99)).toEqual([{ id: 'new', position: 2000 }]);
    });

    it('rebalances only when the gap is used up, sending just the changed items', () => {
      const siblings: { id: string; position: number }[] = [
        { id: 'a', position: 1000 },
        { id: 'b', position: 1001 },
        { id: 'c', position: 3000 },
      ];
      // no integer between 1000 and 1001 → list becomes a 1000, new 2000, b 3000, c 4000; a is unchanged
      expect(planMove(siblings, 'new', 1)).toEqual([
        { id: 'new', position: 2000 },
        { id: 'b', position: 3000 },
        { id: 'c', position: 4000 },
      ]);
    });

    it('needs ~10 repeated drops in the same slot before a rebalance', () => {
      let items: { id: string; position: number }[] = list(1000, 2000);
      let singleUpdates: number = 0;
      for (let i: number = 0; i < 20; i++) {
        const updates: { id: string; position: number }[] = planMove(items, `n${i}`, 1);
        if (updates.length > 1) break;
        singleUpdates++;
        items = byPosition([...items, ...updates]);
      }
      expect(singleUpdates).toBeGreaterThanOrEqual(9);
    });
  });

  it('rebalance spreads items 1000 apart', () => {
    expect(rebalance([{ id: 'x' }, { id: 'y' }])).toEqual([
      { id: 'x', position: 1000 },
      { id: 'y', position: 2000 },
    ]);
  });

  it('positionAfterLast appends after the highest position', () => {
    expect(positionAfterLast(list(1000, 5000, 2000))).toBe(6000);
    expect(positionAfterLast([])).toBe(1000);
  });

  it('byPosition sorts without mutating', () => {
    const input: { id: string; position: number }[] = list(3000, 1000);
    expect(byPosition(input).map((i: { position: number }) => i.position)).toEqual([1000, 3000]);
    expect(input[0].position).toBe(3000);
  });
});

describe('toFullIndex', () => {
  const full: { id: string }[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const visible: { id: string }[] = [{ id: 'b' }, { id: 'd' }]; // a and c are filtered out

  it('drops before the visible item at that index', () => {
    expect(toFullIndex(full, visible, 0)).toBe(1); // before b
    expect(toFullIndex(full, visible, 1)).toBe(3); // before d
  });

  it('drops after the last visible item at the end', () => {
    expect(toFullIndex(full, visible, 2)).toBe(4);
  });

  it('appends when nothing is visible', () => {
    expect(toFullIndex(full, [], 0)).toBe(4);
  });
});
