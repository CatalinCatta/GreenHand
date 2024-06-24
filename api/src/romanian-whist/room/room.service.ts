import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UtilityService } from '../utility/utility.service';
import { Game } from 'shared/src/dto/romanianWhist/Game';

@Injectable()
export class RoomService {
  constructor(private readonly utilityService: UtilityService) {}

  /**
   * Creates a new game and adds it to the list of games.
   * @returns {number} The ID of the newly created game.
   */
  newGame(): number {
    const gameId: number = Date.now();
    this.utilityService.addGame({
      id: gameId,
      users: [],
      cards: [],
      scoreTable: [],
      playedCards: [],
    });
    return gameId;
  }

  /**
   * Adds a player to a game.
   * @param {number} gameId - The ID of the game.
   * @param {string} playerName - The name of the player to add.
   * @returns {number} The ID of the newly added player.
   * @throws {HttpException} If the player name already exists.
   */
  addPlayer(gameId: number, playerName: string): number {
    const game: Game = this.utilityService.getGame(gameId);

    if (this.utilityService.existPlayerWithName(game, playerName))
      throw new HttpException('Name already in use', HttpStatus.CONFLICT);

    const userId: number = Date.now();
    game.users.push({ id: userId, name: playerName });
    return userId;
  }

  /**
   * Removes a player from a game.
   * @param {number} gameId - The ID of the game.
   * @param {number} playerId - The ID of the player to remove.
   * @throws {HttpException} If the player ID is invalid.
   */
  removePlayer(gameId: number, playerId: number): void {
    const game: Game = this.utilityService.getGame(gameId);
    game.users.splice(this.utilityService.getUserIndex(game, playerId), 1);
  }

  /**
   * Removes a game from the list of games.
   * @param {number} gameId - The ID of the game to remove.
   * @throws {HttpException} If the game ID is invalid.
   */
  removeGame(gameId: number): void {
    this.utilityService.getAllGames.splice(this.utilityService.getGameIndex(gameId), 1);
  }
}
