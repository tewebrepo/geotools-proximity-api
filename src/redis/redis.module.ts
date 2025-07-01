import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('storage.redis.host'),
          port: configService.get<number>('storage.redis.port'),
          password: configService.get<string>('storage.redis.password'),
          retryStrategy: (times) =>
            times > 3 ? null : Math.min(times * 1000, 3000),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
