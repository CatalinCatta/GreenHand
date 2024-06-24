import { Module } from '@nestjs/common';
import { GamePhaseService } from './game-phase/game-phase.service';
import { RoomService } from './room/room.service';
import { RomanianWhistController } from './romanian-whist.controller';
import { UtilityService } from './utility/utility.service';

@Module({
  providers: [GamePhaseService, RoomService, UtilityService],
  controllers: [RomanianWhistController],
})
export class RomanianWhistModule {}
