import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Game, PlayerData, ScoreTableRow } from '@dto/romanianWhist';
import { Card, CardType, User } from '@dto';

@Injectable()
export class UtilityService {
  private games: Game[] = [];

  /**
   * Returns all games.
   */
  getAllGames(): Game[] {
    return this.games;
  }

  /**
   * Adds a new game to the list.
   * @param game - The game to add.
   */
  addGame(game: Game): void {
    this.games.push(game);
  }

  /**
   * Gets the index of a game by its ID.
   * @param gameId - The ID of the game.
   * @returns The index of the game.
   * @throws HttpException if the game ID is invalid.
   */
  getGameIndex(gameId: number): number {
    const gameIndex: number = this.games.findIndex((game: Game) => game.id === gameId);
    if (gameIndex === -1) throw new HttpException('Invalid game ID', HttpStatus.NOT_FOUND);

    return gameIndex;
  }

  /**
   * Retrieves a game by its ID.
   * @param gameId - The ID of the game.
   * @returns The game object.
   * @throws HttpException if the game ID is invalid.
   */
  getGame(gameId: number): Game {
    return this.games[this.getGameIndex(gameId)];
  }

  /**
   * Retrieves the first unplayed row from a game's score table.
   * @param game - The game or game ID.
   * @returns The first unplayed ScoreTableRow.
   * @throws HttpException if there is no unplayed game.
   */
  getFirstUnplayedRowFromGame(game: number | Game): ScoreTableRow {
    const unplayedRow: ScoreTableRow = (typeof game === 'number' ? this.getGame(game) : game).scoreTable.find(
      (scoreTableRow: ScoreTableRow) => !scoreTableRow.hasBeenPlayed
    );
    if (!unplayedRow) throw new HttpException('There is no unplayed game', HttpStatus.NO_CONTENT);

    return unplayedRow;
  }

  /**
   * Retrieves player data from a score table row or game.
   * @param data - The score table row or game ID.
   * @param playerId - The ID of the player.
   * @returns The player data.
   * @throws HttpException if the player ID is invalid.
   */
  getPlayerData(data: ScoreTableRow | number, playerId: number): PlayerData {
    const playerData: PlayerData = (
      typeof data === 'number' ? this.getFirstUnplayedRowFromGame(data) : data
    ).playersData.find((player: PlayerData) => player.user.id === playerId);
    if (playerData === undefined) throw new HttpException('Invalid player ID', HttpStatus.NOT_FOUND);

    return playerData;
  }

  /**
   * Retrieves the index of a user in a game by their ID.
   * @param game - The game object.
   * @param userId - The ID of the user.
   * @returns The index of the user.
   * @throws HttpException if the user ID is invalid.
   */
  getUserIndex(game: Game, userId: number): number {
    const userIndex: number = game.users.findIndex((user: User) => user.id === userId);
    if (userIndex === -1) throw new HttpException('Invalid user ID', HttpStatus.NOT_FOUND);

    return userIndex;
  }

  /**
   * Checks if a player with a given name exists in a game.
   * @param game - The game object.
   * @param userName - The name of the user.
   * @returns True if the player exists, false otherwise.
   */
  doesPlayerExistWithName(game: Game, userName: string): boolean {
    return game.users.some((user: User) => user.name === userName);
  }

  /**
   * Retrieves the index of a card in a list of cards.
   * @param cards - The list of cards.
   * @param card - The card or card type.
   * @returns The index of the card.
   * @throws HttpException if the card is invalid.
   */
  getCardIndex(cards: Card[], card: Card | CardType): number {
    const cardIndex: number = cards.findIndex((playerCard: Card) =>
      typeof card === 'string' ? playerCard.cardType === card : playerCard === card
    );
    if (cardIndex === -1) throw new HttpException('Invalid card', HttpStatus.NOT_FOUND);

    return cardIndex;
  }

  /**
   * Retrieves the index of the first player in a score table row.
   * @param currentScoreRow - The current score table row.
   * @returns The index of the first player.
   * @throws HttpException if the first player cannot be found.
   */
  getIndexOfFirstPlayer(currentScoreRow: ScoreTableRow): number {
    const playerIndex: number = currentScoreRow.playersData.findIndex((player: PlayerData) => player.isFirstPlayer);
    if (playerIndex === -1) throw new HttpException('Cannot find first player', HttpStatus.NOT_FOUND);

    return playerIndex;
  }

  /**
   * Checks if a list of cards has a card of a specified type.
   * @param cardsList - The list of cards.
   * @param cardType - The type of card.
   * @returns True if the player has a card of the specified type, false otherwise.
   */
  haveCardOfType(cardsList: Card[], cardType: CardType): boolean {
    return cardsList.some((card: Card) => card.cardType === cardType);
  }

  /**
   * Retrieves all cards of a specified type.
   * @param cards - The player data.
   * @param cardType - The type of card.
   * @returns A list of cards of the specified type.
   */
  getAllCardsOfType(cards: Card[], cardType: CardType): Card[] {
    return cards.filter((card: Card) => card.cardType === cardType);
  }

  /**
   * Retrieves the first player from a score table row.
   * @param currentScoreRow - The current score table row.
   * @returns The first player data.
   */
  getFirstPlayer(currentScoreRow: ScoreTableRow): PlayerData {
    return currentScoreRow.playersData[this.getIndexOfFirstPlayer(currentScoreRow)];
  }
}
