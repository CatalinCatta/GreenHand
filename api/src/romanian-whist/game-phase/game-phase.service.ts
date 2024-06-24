import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Game } from 'shared/src/dto/romanianWhist/Game';
import { PlayerData } from 'shared/src/dto/romanianWhist/PlayerData';
import { ScoreTableRow } from 'shared/src/dto/romanianWhist/ScoreTable';
import { Card } from 'shared/src/dto/Card';
import { CardType } from 'shared/src/dto/enums';
import { UtilityService } from '../utility/utility.service';

@Injectable()
export class GamePhaseService {
  constructor(private readonly utilityService: UtilityService) {}

  initiateGame(gameId: number) {
    const game: Game = this.utilityService.getGame(gameId);
    this.createScoreTable(game);
    this.dealCards(game);
  }

  getAllPossibleBets(gameId: number, playerId: number): number[] {
    const currentScoreRow: ScoreTableRow = this.utilityService.getFirstUnplayedRowFromGame(gameId);
    let possibleBets: number[] = [];
    const isLastPlayer: boolean = this.isLastPlayer(playerId, currentScoreRow);

    for (let i = 0; i <= currentScoreRow.nrOfCards; i++)
      if (!isLastPlayer || this.isBetValidForLastPlayer(currentScoreRow, i)) possibleBets.push(i);

    return possibleBets;
  }

  addBet(gameId: number, playerId: number, bet: number): void {
    const currentScoreRow: ScoreTableRow = this.utilityService.getFirstUnplayedRowFromGame(gameId);
    const player: PlayerData = this.utilityService.getPlayerData(currentScoreRow, playerId);
    if (
      bet > currentScoreRow.nrOfCards ||
      (this.isLastPlayer(playerId, currentScoreRow) && !this.isBetValidForLastPlayer(currentScoreRow, bet))
    )
      throw new HttpException('Cannot bet this nr', HttpStatus.CONFLICT);

    player.bet = bet;
  }

  playCard(gameId: number, playerId: number, card: Card): void {
    const game: Game = this.utilityService.getGame(gameId);
    const currentScoreRow: ScoreTableRow = this.utilityService.getFirstUnplayedRowFromGame(game);
    const player: PlayerData = this.utilityService.getPlayerData(currentScoreRow, playerId);
    const cardIndex: number = this.utilityService.getCardIndex(player.cards, card);

    if (player.isFirstPlayer || card.cardType === game.playedCards[0].cardType)
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

  showPlayableCards(gameId: number, playerId: number): Card[] {
    const game: Game = this.utilityService.getGame(gameId);
    const player: PlayerData = this.utilityService.getPlayerData(gameId, playerId);

    return player.isFirstPlayer
      ? player.cards
      : this.utilityService.haveCardOfType(player.cards, game.playedCards[0].cardType)
        ? this.utilityService.getAllCardsOfTypeForPlayer(player, game.playedCards[0].cardType)
        : this.utilityService.haveCardOfType(player.cards, game.lastCard.cardType)
          ? this.utilityService.getAllCardsOfTypeForPlayer(player, game.lastCard.cardType)
          : player.cards;
  }

  getScoreTable(gameId: number): ScoreTableRow[] {
    return this.utilityService.getGame(gameId).scoreTable;
  }

  private dealCards(game: Game): void {
    const currentScoreRow: ScoreTableRow = this.utilityService.getFirstUnplayedRowFromGame(game);
    this.createCards(game);

    for (const player of currentScoreRow.playersData) {
      player.cards = game.cards.splice(0, currentScoreRow.nrOfCards);
      player.isFirstPlayer = false;
      player.actualScore = 0;
    }

    currentScoreRow.playersData[(currentScoreRow.gameNumber - 1) % currentScoreRow.playersData.length].isFirstPlayer =
      true;

    if (!this.isFullHandGame(currentScoreRow)) game.lastCard = game.cards.splice(0, 1)[0];
  }

  private endRound(currentScoreRow: ScoreTableRow): void {
    currentScoreRow.hasBeenPlayed = true;
    for (const player of currentScoreRow.playersData)
      player.points += player.bet === player.actualScore ? 5 + player.bet : Math.abs(player.bet - player.actualScore);
  }

  private finishCardPlacement(game: Game, currentScoreRow: ScoreTableRow): void {
    let highestCard: Card = game.playedCards[0];
    for (const card of game.cards) {
      if (
        !this.isFullHandGame(currentScoreRow) &&
        this.utilityService.haveCardOfType(game.cards, game.lastCard.cardType)
      ) {
        if (
          card.cardType === game.lastCard.cardType &&
          (highestCard.cardType !== game.lastCard.cardType || highestCard.cardNumber < card.cardNumber)
        )
          highestCard = card;
        continue;
      }
      if (highestCard.cardType === card.cardType && highestCard.cardNumber < card.cardNumber) highestCard = card;
    }

    const winner: PlayerData =
      currentScoreRow.playersData[
        this.utilityService.getIndexOfFirstPlayer(currentScoreRow) +
          (this.utilityService.getCardIndex(game.cards, highestCard.cardType) % currentScoreRow.playersData.length)
      ];

    winner.actualScore++;
    winner.isFirstPlayer = true;
    this.utilityService.getFirstPlayer(currentScoreRow).isFirstPlayer = false;
    game.playedCards = [];

    if (currentScoreRow.playersData[0].cards.length === 0) {
      this.endRound(currentScoreRow);
      if (game.scoreTable.slice(-1)[0] !== currentScoreRow) this.dealCards(game);
    }
  }

  private isLastPlayer(playerId: number, currentScoreRow: ScoreTableRow): boolean {
    const firstPlayerIndex: number = currentScoreRow.playersData.findIndex(
      (player: PlayerData) => player.isFirstPlayer
    );
    const currentPlayerIndex: number = currentScoreRow.playersData.findIndex(
      (player: PlayerData) => player.user.id === playerId
    );

    return firstPlayerIndex === 0
      ? currentPlayerIndex === currentScoreRow.playersData.length
      : currentPlayerIndex === firstPlayerIndex - 1;
  }

  private isBetValidForLastPlayer(currentScoreRow: ScoreTableRow, bet: number): boolean {
    return (
      currentScoreRow.nrOfCards !==
      currentScoreRow.playersData.reduce((total, playerData) => {
        return total + playerData.bet;
      }, 0) +
        bet
    );
  }

  private createCards(game: Game): void {
    game.cards = [];
    for (let i = 14; i > 14 - game.users.length * 2; i--)
      for (const card of Object.keys(CardType))
        game.cards.push({
          cardNumber: i,
          cardType: CardType[card],
        });
    this.shuffleCards(game);
  }

  private createScoreTable(game: Game): void {
    const usersNr: number = game.users.length;
    let playersData: PlayerData[] = [];
    for (const gameUser of game.users) playersData.push({ user: gameUser, isFirstPlayer: false });

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

  private shuffleCards(game: Game): void {
    for (let i = game.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [game.cards[i], game.cards[j]] = [game.cards[j], game.cards[i]];
    }
  }

  private isFullHandGame(currentScoreRow: ScoreTableRow): boolean {
    return currentScoreRow.nrOfCards === 8;
  }
}
