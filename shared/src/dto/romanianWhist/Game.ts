import { User } from '../User';
import { ScoreTableRow } from './ScoreTable';
import { Card } from '../Card';

export interface Game {
  id: number;
  users: Array<User>;
  cards: Array<Card>;
  lastCard?: Card;
  scoreTable: Array<ScoreTableRow>;
  playedCards: Array<Card>;
}
