import { Module } from '@nestjs/common';
import { RomanianWhistModule } from './romanian-whist/romanian-whist.module';

@Module({
  imports: [RomanianWhistModule],
})
export class AppModule {}
