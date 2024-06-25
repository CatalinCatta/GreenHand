import { Module } from '@nestjs/common';
import { GamePhaseService, RomanianWhistController, RoomService, UtilityService } from '@/romanian-whist';

@Module({
  providers: [GamePhaseService, RoomService, UtilityService],
  controllers: [RomanianWhistController],
})
export class RomanianWhistModule {}
