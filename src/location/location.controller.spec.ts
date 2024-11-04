import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

describe('LocationController', () => {
  let controller: LocationController;
  let service: LocationService;

  const mockLocationService = {
    findNearby: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    service = module.get<LocationService>(LocationService);
  });

  describe('findNearby', () => {
    it('should return nearby locations', async () => {
      const mockResult = [{ city: 'Tokyo' }];
      mockLocationService.findNearby.mockResolvedValue(mockResult);

      const result = await controller.findNearby({
        latitude: 35.6897,
        longitude: 139.6922,
        distance: 5000,
        count: 1,
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
    });
  });
});
