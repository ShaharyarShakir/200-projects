import { Controller, Get } from '@nestjs/common';
import { getMongoClient } from '@eraser/database';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      message: 'ER Flow API',
    };
  }

  @Get('health')
  async health() {
    let databaseConnected = false;
    try {
      const client = await getMongoClient();
      await client.db().admin().ping();
      databaseConnected = true;
    } catch (err) {
      databaseConnected = false;
    }

    return {
      status: 'ok',
      database: databaseConnected,
      version: '0.1.0',
    };
  }

  @Get('version')
  version() {
    return {
      version: '0.1.0',
    };
  }
}
