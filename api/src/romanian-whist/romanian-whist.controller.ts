import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { GamePhaseService, RoomService } from '@/romanian-whist';
import { ScoreTableRow } from '@dto/romanianWhist';
import { Card, User } from '@dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Romanian-Whist')
@Controller('romanian-whist')
export class RomanianWhistController {
  constructor(
    private readonly gamePhaseService: GamePhaseService,
    private readonly roomService: RoomService
  ) {}

  @Post('rooms')
  createRoom(): number {
    return this.roomService.newGame();
  }

  @Post('rooms/:gameId/players')
  addPlayer(@Body() player: User, @Param('gameId') gameId: string): number {
    const gameIdNumber: number = parseInt(gameId, 10);
    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);

    return this.roomService.addPlayer(gameIdNumber, player.name);
  }

  @Delete('rooms/:gameId/players/:userId')
  removePlayer(@Param('gameId') gameId: string, @Param('userId') userId: string): void {
    const gameIdNumber: number = parseInt(gameId, 10);
    const userIdNumber: number = parseInt(userId, 10);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);

    this.roomService.removePlayer(gameIdNumber, userIdNumber);
  }

  @Delete('rooms/:gameId')
  removeGame(@Param('gameId') gameId: string): void {
    const gameIdNumber: number = parseInt(gameId, 10);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);

    this.roomService.removeGame(gameIdNumber);
  }

  @Post('rooms/:gameId/start')
  startGame(@Param('gameId') gameId: string): void {
    const gameIdNumber: number = parseInt(gameId, 10);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);

    this.gamePhaseService.initiateGame(gameIdNumber);
  }

  @Get('games/:gameId/score')
  getScoreTable(@Param('gameId') gameId: string): ScoreTableRow[] {
    const gameIdNumber: number = parseInt(gameId, 10);
    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);

    return this.gamePhaseService.getScoreTable(gameIdNumber);
  }

  @Get('games/:gameId/players/:userId/bets')
  getPossibleBets(@Param('gameId') gameId: string, @Param('userId') userId: string): number[] {
    const gameIdNumber: number = parseInt(gameId, 10);
    const userIdNumber: number = parseInt(userId, 10);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);

    return this.gamePhaseService.getAllPossibleBets(gameIdNumber, userIdNumber);
  }

  @Post('games/:gameId/players/:userId/bets')
  makeBet(@Param('gameId') gameId: string, @Param('userId') userId: string, @Param('bet') bet: string): void {
    const gameIdNumber: number = parseInt(gameId, 10);
    const userIdNumber: number = parseInt(userId, 10);
    const betNumber: number = parseInt(bet, 10);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(betNumber)) throw new HttpException('Invalid bet', HttpStatus.BAD_REQUEST);

    this.gamePhaseService.addBet(gameIdNumber, userIdNumber, betNumber);
  }

  @Get('games/:gameId/players/:userId/cards')
  getPlayableCards(@Param('gameId') gameId: string, @Param('userId') userId: string): Card[] {
    const gameIdNumber: number = parseInt(gameId, 10);
    const userIdNumber: number = parseInt(userId, 10);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);

    return this.gamePhaseService.showPlayableCards(gameIdNumber, userIdNumber);
  }

  @Post('games/:gameId/players/:userId/cards')
  playCard(@Param('gameId') gameId: string, @Param('userId') userId: string, @Body() card: Card): void {
    const gameIdNumber: number = parseInt(gameId, 10);
    const userIdNumber: number = parseInt(userId, 10);

    if (Number.isNaN(gameIdNumber)) throw new HttpException('Invalid game ID', HttpStatus.BAD_REQUEST);
    if (Number.isNaN(userIdNumber)) throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);

    this.gamePhaseService.playCard(gameIdNumber, userIdNumber, card);
  }
}
