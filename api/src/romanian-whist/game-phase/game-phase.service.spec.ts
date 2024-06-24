import { Test, TestingModule } from '@nestjs/testing';
import { GamePhaseService } from '@/romanian-whist';

describe('GamePhaseService', () => {
  let service: GamePhaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamePhaseService],
    }).compile();

    service = module.get<GamePhaseService>(GamePhaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
