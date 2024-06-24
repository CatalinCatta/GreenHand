import { Test, TestingModule } from '@nestjs/testing';
import { RomanianWhistController } from './romanian-whist.controller';

describe('RomanianWhistController', () => {
  let controller: RomanianWhistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RomanianWhistController],
    }).compile();

    controller = module.get<RomanianWhistController>(RomanianWhistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
