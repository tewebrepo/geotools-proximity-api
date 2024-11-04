import { Controller, Get, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * LocationController - Manages requests related to locations.
 */
@Controller('locations')
@ApiTags('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * GET /locations/nearby - Find nearby locations.
   * @param query - The parameters for the nearby location search.
   * @returns An object containing success status and result locations.
   */
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby locations' })
  async findNearby(@Query() query: NearbyQueryDto) {
    const locations = await this.locationService.findNearby(query);
    return {
      success: true,
      result: locations,
    };
  }
}
