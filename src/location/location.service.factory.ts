import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseLocationService } from './interfaces/base-location.service';
import { RedisLocationService } from './redis-location.service';
import { SQLiteLocationService } from './sqlite-location.service';

@Injectable()
export class LocationServiceFactory {
  constructor(private configService: ConfigService) {}

  async createLocationService(): Promise<BaseLocationService> {
    const mode = this.configService.get<string>('storage.mode') || 'auto';

    if (mode === 'sqlite') {
      return new SQLiteLocationService(this.configService);
    }

    if (mode === 'redis' || mode === 'auto') {
      try {
        const redisService = new RedisLocationService(this.configService);
        await redisService.healthCheck();
        return redisService;
      } catch (error: Error | any) {
        console.error('Redis connection failed:', error);
        if (mode === 'redis') {
          throw new Error('Redis connection failed and fallback is disabled');
        }
        console.warn('Redis connection failed, falling back to SQLite');
        return new SQLiteLocationService(this.configService);
      }
    }

    throw new Error(`Invalid storage mode: ${mode}`);
  }
}
