import { User } from '../User';
import { Card } from '../Card';

export interface PlayerData {
  user: User;
  bet?: number;
  actualScore?: number;
  points?: number;
  cards?: Array<Card>;
  isFirstPlayer: boolean;
}
