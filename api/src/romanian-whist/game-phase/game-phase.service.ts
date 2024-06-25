import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Game, PlayerData, ScoreTableRow } from '@dto/romanianWhist';
import { Card, CardType, User } from '@dto';
import { UtilityService } from '@/romanian-whist';

@Injectable()
export class GamePhaseService {
  constructor(@Inject(forwardRef(() => UtilityService)) private readonly utilityService: UtilityService) {}

  /**
   * Initiates a game by creating a score table and dealing cards.
   * @param {number} gameId - The ID of the game to initiate.
   */
  initiateGame(gameId: number): void {
    const game: Game = this.utilityService.getGame(gameId);
    this.createScoreTable(game);
    this.dealCards(game);
  }

  /**
   * Gets all possible bets for a player in a game.
   * @param {number} gameId - The ID of the game.
   * @param {number} playerId - The ID of the player.
   * @returns {number[]} An array of possible bets.
   */
  getAllPossibleBets(gameId: number, playerId: number): number[] {
    const currentScoreRow: ScoreTableRow = this.utilityService.getFirstUnplayedRowFromGame(gameId);
    const possibleBets: number[] = [];
    const isLastPlayer: boolean = this.isLastPlayer(playerId, currentScoreRow);

    for (let i = 0; i <= currentScoreRow.nrOfCards; i++)
      if (!isLastPlayer || this.isBetValidForLastPlayer(currentScoreRow, i)) possibleBets.push(i);

    return possibleBets;
  }

  /**
   * Adds a bet for a player in a game.
   * @param {number} gameId - The ID of the game.
   * @param {number} playerId - The ID of the player.
   * @param {number} bet - The bet to add.
   * @throws {HttpException} If the bet is invalid or it's not the player's turn.
   */
  addBet(gameId: number, playerId: number, bet: number): void {
    const currentScoreRow: ScoreTableRow = this.utilityService.getFirstUnplayedRowFromGame(gameId);
    const player: PlayerData = this.utilityService.getPlayerData(currentScoreRow, playerId);

    if (!player.cards || player.cards.length === 0)
      throw new HttpException('Wait for cards distribution', HttpStatus.NOT_ACCEPTABLE);

    if (
      player.bet !== null ||
      (!player.isFirstPlayer && this.getThePlayerBeforeCurrentPlayer(player, currentScoreRow).bet === null)
    )
      throw new HttpException('Wait for your turn', HttpStatus.NOT_ACCEPTABLE);

    if (
      bet > currentScoreRow.nrOfCards ||
      (this.isLastPlayer(playerId, currentScoreRow) && !this.isBetValidForLastPlayer(currentScoreRow, bet))
    )
      throw new HttpException('Cannot bet this number', HttpStatus.CONFLICT);

    player.bet = bet;
  }

  /**
   * Plays a card for a player in a game.
   * @param {number} gameId - The ID of the game.
   * @param {number} playerId - The ID of the player.
   * @param {Card} card - The card to play.
   * @throws {HttpException} If the card is invalid or it's not the player's turn.
   */
  playCard(gameId: number, playerId: number, card: Card): void {
    const game: Game = this.utilityService.getGame(gameId);
    const currentScoreRow: ScoreTableRow = this.utilityService.getFirstUnplayedRowFromGame(game);
    const player: PlayerData = this.utilityService.getPlayerData(currentScoreRow, playerId);
    const cardIndex: number = this.utilityService.getCardIndex(player.cards, card);
    const nrOfCardsOfPlayerBeforeThisPlayer: number = this.getThePlayerBeforeCurrentPlayer(player, currentScoreRow)
      .cards.length;

    if (player.bet === null) throw new HttpException('Place your bet first', HttpStatus.NOT_ACCEPTABLE);
    else if (
      player.isFirstPlayer
        ? player.cards.length < nrOfCardsOfPlayerBeforeThisPlayer
        : player.cards.length <= nrOfCardsOfPlayerBeforeThisPlayer
    )
      throw new HttpException('Wait for your turn', HttpStatus.NOT_ACCEPTABLE);
    else if (player.isFirstPlayer || card.cardType === game.playedCards[0].cardType)
      game.playedCards.push(player.cards.splice(cardIndex, 1)[0]);
    else if (this.utilityService.haveCardOfType(player.cards, game.playedCards[0].cardType))
      throw new HttpException('Player should play a card from the suit led', HttpStatus.CONFLICT);
    else if (
      this.isFullHandGame(currentScoreRow) ||
      card.cardType === game.lastCard.cardType ||
      !this.utilityService.haveCardOfType(player.cards, game.lastCard.cardType)
    )
      game.playedCards.push(player.cards.splice(cardIndex, 1)[0]);
    else throw new HttpException('Player should play trump card if has no cards of the suit led', HttpStatus.CONFLICT);

    if (this.isLastPlayer(playerId, currentScoreRow)) this.finishCardPlacement(game, currentScoreRow);
  }

  /**
   * Shows the playable cards for a player in a game.
   * @param {number} gameId - The ID of the game.
   * @param {number} playerId - The ID of the player.
   * @returns {Card[]} An array of playable cards.
   */
  showPlayableCards(gameId: number, playerId: number): Card[] {
    const game: Game = this.utilityService.getGame(gameId);
    const player: PlayerData = this.utilityService.getPlayerData(gameId, playerId);

    return player.isFirstPlayer
      ? player.cards
      : this.utilityService.haveCardOfType(player.cards, game.playedCards[0].cardType)
        ? this.utilityService.getAllCardsOfType(player.cards, game.playedCards[0].cardType)
        : this.utilityService.haveCardOfType(player.cards, game.lastCard.cardType)
          ? this.utilityService.getAllCardsOfType(player.cards, game.lastCard.cardType)
          : player.cards;
  }

  /**
   * Gets the score table for a game.
   * @param {number} gameId - The ID of the game.
   * @returns {ScoreTableRow[]} The score table of the game.
   */
  getScoreTable(gameId: number): ScoreTableRow[] {
    return this.utilityService.getGame(gameId).scoreTable;
  }

  /**
   * Gets the player before the current player in the score row.
   * @param {PlayerData} currentPlayer - The current player data.
   * @param {ScoreTableRow} currentScoreRow - The current score row.
   * @returns {PlayerData} The player before the current player.
   */
  private getThePlayerBeforeCurrentPlayer(currentPlayer: PlayerData, currentScoreRow: ScoreTableRow): PlayerData {
    return currentScoreRow.playersData.slice(currentScoreRow.playersData.indexOf(currentPlayer) - 1)[0];
  }

  /**
   * Deals cards to players in a game.
   * @param {Game} game - The game object.
   */
  private dealCards(game: Game): void {
    const currentScoreRow: ScoreTableRow = this.utilityService.getFirstUnplayedRowFromGame(game);
    this.createCards(game);

    currentScoreRow.playersData.map((player: PlayerData) => {
      player.cards = game.cards.splice(0, currentScoreRow.nrOfCards);
      player.isFirstPlayer = false;
      player.actualScore = 0;
    });

    currentScoreRow.playersData[(currentScoreRow.gameNumber - 1) % currentScoreRow.playersData.length].isFirstPlayer =
      true;

    game.lastCard = !this.isFullHandGame(currentScoreRow) && game.cards.splice(0, 1)[0];
  }

  /**
   * Ends a round and updates player scores.
   * @param {ScoreTableRow} currentScoreRow - The current score row.
   */
  private endRound(currentScoreRow: ScoreTableRow): void {
    currentScoreRow.hasBeenPlayed = true;
    currentScoreRow.playersData.map(
      (player: PlayerData) =>
        (player.points +=
          player.bet === player.actualScore ? 5 + player.bet : Math.abs(player.bet - player.actualScore))
    );
  }

  /**
   * Finishes the card placement for a round.
   * @param {Game} game - The game object.
   * @param {ScoreTableRow} currentScoreRow - The current score row.
   */
  private finishCardPlacement(game: Game, currentScoreRow: ScoreTableRow): void {
    let highestCard: Card =
      !this.isFullHandGame(currentScoreRow) && this.utilityService.haveCardOfType(game.cards, game.lastCard.cardType)
        ? game.playedCards.find((card: Card) => card.cardType === game.lastCard.cardType)
        : game.playedCards[0];

    this.utilityService.getAllCardsOfType(game.cards, highestCard.cardType).map((card: Card) => {
      if (highestCard.cardNumber < card.cardNumber) highestCard = card;
    });

    const winner: PlayerData =
      currentScoreRow.playersData[
        this.utilityService.getIndexOfFirstPlayer(currentScoreRow) +
          (this.utilityService.getCardIndex(game.cards, highestCard.cardType) % currentScoreRow.playersData.length)
      ];

    this.utilityService.getFirstPlayer(currentScoreRow).isFirstPlayer = false;
    game.playedCards = [];
    winner.actualScore++;
    winner.isFirstPlayer = true;

    if (currentScoreRow.playersData[0].cards.length > 0) return;

    this.endRound(currentScoreRow);
    if (game.scoreTable.slice(-1)[0] !== currentScoreRow) this.dealCards(game);
  }

  /**
   * Checks if the given player is the last player in the current score row.
   * @param {number} playerId - The ID of the player.
   * @param {ScoreTableRow} currentScoreRow - The current score row.
   * @returns {boolean} True if the player is the last player, false otherwise.
   */
  private isLastPlayer(playerId: number, currentScoreRow: ScoreTableRow): boolean {
    const firstPlayerIndex: number = this.utilityService.getIndexOfFirstPlayer(currentScoreRow);

    return (
      currentScoreRow.playersData.findIndex((player: PlayerData) => player.user.id === playerId) ===
      (firstPlayerIndex === 0 ? currentScoreRow.playersData.length : firstPlayerIndex) - 1
    );
  }

  /**
   * Checks if the given bet is valid for the last player in the current score row.
   * @param {ScoreTableRow} currentScoreRow - The current score row.
   * @param {number} bet - The bet to check.
   * @returns {boolean} True if the bet is valid, false otherwise.
   */
  private isBetValidForLastPlayer(currentScoreRow: ScoreTableRow, bet: number): boolean {
    return (
      currentScoreRow.nrOfCards !==
      currentScoreRow.playersData.reduce((total, playerData) => {
        return total + playerData.bet;
      }, 0) +
        bet
    );
  }

  /**
   * Creates cards for a game and shuffles them.
   * @param {Game} game - The game object.
   */
  private createCards(game: Game): void {
    game.cards = [];

    for (let i = 14; i > 14 - game.users.length * 2; i--)
      Object.keys(CardType).map((card: keyof CardType) =>
        game.cards.push({
          cardNumber: i,
          cardType: CardType[card],
        })
      );

    this.shuffleCards(game);
  }

  /**
   * Creates a score table for a game.
   * @param {Game} game - The game object.
   */
  private createScoreTable(game: Game): void {
    const usersNr: number = game.users.length;
    let playersData: PlayerData[] = [];
    game.users.map((gameUser: User) => playersData.push({ user: gameUser, isFirstPlayer: false }));

    const addRows = (isRepeatingRound: boolean, startingPosition: number, addingCards: number): void => {
      for (let i = 1; i <= (isRepeatingRound ? usersNr : 6); i++)
        game.scoreTable.push({
          gameNumber: i + startingPosition,
          nrOfCards: i * (isRepeatingRound ? 0 : startingPosition > usersNr ? -1 : 1) + addingCards,
          playersData,
          hasBeenPlayed: false,
        });
    };
    addRows(true, 0, 1);
    addRows(false, usersNr, 1);
    addRows(true, usersNr + 6, 8);
    addRows(false, usersNr * 2 + 6, 8);
    addRows(true, usersNr * 2 + 12, 1);
  }

  /**
   * Shuffles the cards in a game.
   * @param {Game} game - The game object.
   */
  private shuffleCards(game: Game): void {
    for (let i = game.cards.length - 1; i > 0; i--) {
      const j: number = Math.floor(Math.random() * (i + 1));
      [game.cards[i], game.cards[j]] = [game.cards[j], game.cards[i]];
    }
  }

  /**
   * Checks if the current score row represents a full hand game (8 cards each).
   * @param {ScoreTableRow} currentScoreRow - The current score row.
   * @returns {boolean} True if it's a full hand game, false otherwise.
   */
  private isFullHandGame(currentScoreRow: ScoreTableRow): boolean {
    return currentScoreRow.nrOfCards === 8;
  }
}
