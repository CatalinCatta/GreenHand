import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Game, PlayerData, ScoreTableRow } from '@dto/romanianWhist';
import { Card, CardType, User } from '@dto';

@Injectable()
export class UtilityService {
  private games: Game[] = [];

  getAllGames: Game[] = this.games;

  addGame(game: Game) {
    this.games.push(game);
  }

  getGameIndex(gameId: number): number {
    const gameIndex: number = this.games.findIndex((game: Game) => game.id === gameId);
    if (gameIndex === -1) throw new HttpException('Invalid game id', HttpStatus.NOT_FOUND);

    return gameIndex;
  }

  getGame(gameId: number): Game {
    return this.games[this.getGameIndex(gameId)];
  }

  getFirstUnplayedRowFromGame(game: number | Game): ScoreTableRow {
    const unplayedRow: ScoreTableRow = (typeof game === 'number' ? this.getGame(game) : game).scoreTable.find(
      (scoreTableRow: ScoreTableRow) => scoreTableRow.hasBeenPlayed === false
    );
    if (!unplayedRow) throw new HttpException('There is no unplayed game', HttpStatus.NO_CONTENT);

    return unplayedRow;
  }

  getPlayerData(data: ScoreTableRow | number, playerId: number): PlayerData {
    const playerData: PlayerData = (
      typeof data === 'number' ? this.getFirstUnplayedRowFromGame(data) : data
    ).playersData.find((player: PlayerData) => player.user.id === playerId);
    if (playerData === undefined) throw new HttpException('Invalid player ID', HttpStatus.NOT_FOUND);

    return playerData;
  }

  getUserIndex(game: Game, userId: number): number {
    const userIndex: number = game.users.findIndex((user: User) => user.id === userId);
    if (userIndex === -1) throw new HttpException('Invalid user id', HttpStatus.NOT_FOUND);

    return userIndex;
  }

  existPlayerWithName(game: Game, userName: string): boolean {
    const user: User = game.users.find((user: User) => user.name === userName);
    return user !== undefined;
  }

  getCardIndex(cards: Card[], card: Card | CardType): number {
    const cardIndex: number = cards.findIndex(
      (playerCard: Card) => (typeof card === typeof CardType ? playerCard.cardType : playerCard) === card
    );
    if (cardIndex === -1) throw new HttpException('Invalid card', HttpStatus.NOT_FOUND);

    return cardIndex;
  }

  getIndexOfFirstPlayer(currentScoreRow: ScoreTableRow): number {
    const playerIndex: number = currentScoreRow.playersData.findIndex((player: PlayerData) => player.isFirstPlayer);
    if (playerIndex === -1) throw new HttpException('Cannot find first player', HttpStatus.NOT_FOUND);

    return playerIndex;
  }

  haveCardOfType(cardsList: Card[], cardType: CardType): boolean {
    return cardsList.find((card: Card) => card.cardType === cardType) !== undefined;
  }

  getAllCardsOfTypeForPlayer(player: PlayerData, cardType: CardType): Card[] {
    return player.cards.filter((card: Card) => card.cardType === cardType);
  }

  getFirstPlayer(currentScoreRow: ScoreTableRow): PlayerData {
    return currentScoreRow.playersData[this.getIndexOfFirstPlayer(currentScoreRow)];
  }
}
