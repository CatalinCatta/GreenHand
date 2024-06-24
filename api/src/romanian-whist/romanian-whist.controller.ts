import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { GamePhaseService } from 'src/romanian-whist/game-phase/game-phase.service';
import { RoomService } from 'src/romanian-whist/room/room.service';
import { Card } from 'shared/src/dto/Card';
import { ScoreTableRow } from 'shared/src/dto/romanianWhist/ScoreTable';

@Controller('romanian-whist')
export class RomanianWhistController {
  constructor(
    private readonly gamePhaseService: GamePhaseService,
    private readonly roomService: RoomService
  ) {}

  @Get('scoreTable/:gameId')
  getScoreTable(@Param('gameId') gameId: string): ScoreTableRow[] {
    const gameIdNumber: number = parseInt(gameId);
    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);

    return this.gamePhaseService.getScoreTable(gameIdNumber);
  }

  @Post('createRoom')
  createRoom(): number {
    return this.roomService.newGame();
  }

  @Post('addPlayer/:gameId')
  addPlayer(@Body() player: { playerName: string }, @Param('gameId') gameId: string): number {
    const gameIdNumber: number = parseInt(gameId);
    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);

    return this.roomService.addPlayer(gameIdNumber, player.playerName);
  }

  @Delete('removePlayer/:gameId/:userId')
  removePlayer(@Param('gameId') gameId: string, @Param('userId') userId: string): void {
    const gameIdNumber: number = parseInt(gameId);
    const userIdNumber: number = parseInt(userId);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);

    this.roomService.removePlayer(gameIdNumber, userIdNumber);
  }

  @Delete('removeGame/:gameId')
  removeGame(@Param('gameId') gameId: string): void {
    const gameIdNumber: number = parseInt(gameId);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);

    this.roomService.removeGame(gameIdNumber);
  }

  @Post('startGame/:gameId')
  startGame(@Param('gameId') gameId: string): void {
    const gameIdNumber: number = parseInt(gameId);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);

    this.gamePhaseService.initiateGame(gameIdNumber);
  }

  @Get('getPossibleBets/:gameId/:userId')
  getPossibleBets(@Param('gameId') gameId: string, @Param('userId') userId: string): number[] {
    const gameIdNumber: number = parseInt(gameId);
    const userIdNumber: number = parseInt(userId);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);

    return this.gamePhaseService.getAllPossibleBets(gameIdNumber, userIdNumber);
  }

  @Put('makeBet/:gameId/:userId/:bet')
  makeBet(@Param('gameId') gameId: string, @Param('userId') userId: string, @Param('bet') bet: string): void {
    const gameIdNumber: number = parseInt(gameId);
    const userIdNumber: number = parseInt(userId);
    const betNumber: number = parseInt(bet);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(betNumber)) throw new HttpException('Invalid bet', HttpStatus.BAD_REQUEST);

    this.gamePhaseService.addBet(gameIdNumber, userIdNumber, betNumber);
  }

  @Get('getPlayableCards/:gameId/:userId')
  getPlayableCards(@Param('gameId') gameId: string, @Param('userId') userId: string): Card[] {
    const gameIdNumber: number = parseInt(gameId);
    const userIdNumber: number = parseInt(userId);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);

    return this.gamePhaseService.showPlayableCards(gameIdNumber, userIdNumber);
  }

  @Put('playCard/:gameId/:userId')
  playCard(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() card: Card): void {
    const gameIdNumber: number = parseInt(gameId);
    const userIdNumber: number = parseInt(userId);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);

    this.gamePhaseService.playCard(gameIdNumber, userIdNumber, card);
  }
}
