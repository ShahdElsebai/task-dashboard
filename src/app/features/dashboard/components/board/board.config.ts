import { BOARD_COLUMNS } from '../../dashboard.config';
import { BoardColumnConfig } from '../../dashboard.model';

export const CARD_MENU_LABEL_KEYS: string[] = [
  'tasks.edit',
  'tasks.delete',
  'tasks.moveTo',
  'tasks.moveUp',
  'tasks.moveDown',
  ...BOARD_COLUMNS.map((c: BoardColumnConfig) => c.titleKey),
];
