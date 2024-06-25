import { Module } from '@nestjs/common';
import { RomanianWhistModule } from '@/romanian-whist';

@Module({
  imports: [RomanianWhistModule],
})
export class AppModule {}
