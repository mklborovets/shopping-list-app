import { calculateProgress, sortItems } from '../src/utils/listUtils';
import { ListItem } from '../src/services/firestore';

describe('listUtils', () => {
  it('calculates progress correctly', () => {
    expect(calculateProgress([])).toBe('Empty list');
    
    const items = [
      { isBought: true } as ListItem,
      { isBought: false } as ListItem,
      { isBought: true } as ListItem,
    ];
    expect(calculateProgress(items)).toBe('2/3 bought');
  });

  it('sorts items with unbought first', () => {
    const items = [
      { id: '1', isBought: true } as ListItem,
      { id: '2', isBought: false } as ListItem,
    ];
    
    const sorted = sortItems(items);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
  });
});
