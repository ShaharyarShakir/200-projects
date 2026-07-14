import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

jest.mock('@eraser/database', () => ({
  getMongoClient: jest.fn().mockResolvedValue({
    db: () => ({
      admin: () => ({
        ping: jest.fn().mockResolvedValue(true),
      }),
    }),
  }),
}));

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API identity message', () => {
      expect(appController.root()).toEqual({ message: 'ER Flow API' });
    });
  });

  describe('health', () => {
    it('should return health status and database connected', async () => {
      const health = await appController.health();
      expect(health.status).toBe('ok');
      expect(health.database).toBe(true);
      expect(health.version).toBe('0.1.0');
    });
  });
});
