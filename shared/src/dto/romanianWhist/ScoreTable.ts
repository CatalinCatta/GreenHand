import { PlayerData } from './PlayerData';

export interface ScoreTableRow {
  gameNumber: number;
  nrOfCards: number;
  playersData: Array<PlayerData>;
  hasBeenPlayed: boolean;
}
