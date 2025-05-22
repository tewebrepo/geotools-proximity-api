import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationController } from './location.controller';
import { LocationServiceFactory } from './location.service.factory';
import { BaseLocationService } from './interfaces/base-location.service';

@Module({
  imports: [ConfigModule],
  controllers: [LocationController],
  providers: [
    LocationServiceFactory,
    {
      provide: BaseLocationService,
      useFactory: async (factory: LocationServiceFactory) => {
        return await factory.createLocationService();
      },
      inject: [LocationServiceFactory],
    },
  ],
})
export class LocationModule {}
