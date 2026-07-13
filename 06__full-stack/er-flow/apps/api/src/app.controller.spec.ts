import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: {
            readyState: 1,
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API identity message', () => {
      expect(appController.root()).toEqual({ message: 'ER Flow API' });
    });
  });

  describe('health', () => {
    it('should return health status and database connected', () => {
      const health = appController.health();
      expect(health.status).toBe('ok');
      expect(health.service).toBe('eraser-api');
      expect(health.database).toBe('connected');
      expect(health.timestamp).toBeDefined();
    });
  });
});
