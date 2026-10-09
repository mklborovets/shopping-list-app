import { ListItem } from '../services/firestore';

export const calculateProgress = (items: ListItem[]): string => {
  const total = items.length;
  if (total === 0) return 'Empty list';
  const boughtCount = items.filter(i => i.isBought).length;
  return `${boughtCount}/${total} bought`;
};

export const sortItems = (items: ListItem[]): ListItem[] => {
  return [...items].sort((a, b) => {
    if (a.isBought === b.isBought) return 0;
    return a.isBought ? 1 : -1;
  });
};
