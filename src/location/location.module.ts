import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { RedisModule } from '../redis/redis.module';

/**
 * LocationModule - Handles location-related operations.
 */
@Module({
  imports: [RedisModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
