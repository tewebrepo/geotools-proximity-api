import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * AppController - Handles incoming requests related to application health.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /health - Check the health status of the application.
   * @returns An object containing the health status and timestamp.
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
