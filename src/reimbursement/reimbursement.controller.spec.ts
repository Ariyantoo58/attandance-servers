import { Test, TestingModule } from '@nestjs/testing';
import { ReimbursementController } from './reimbursement.controller';

describe('ReimbursementController', () => {
  let controller: ReimbursementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReimbursementController],
    }).compile();

    controller = module.get<ReimbursementController>(ReimbursementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
