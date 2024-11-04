import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class AppService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  /**
   * Gets the health status of the application.
   * @returns An object containing the status, Redis stats, and current timestamp.
   */
  async getHealth() {
    const redisStatus = await this.checkRedisHealth();
    const redisStats = await this.getRedisStats();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: {
        status: redisStatus,
        stats: redisStats,
      },
    };
  }

  /**
   * Checks Redis health by executing a PING command.
   * @returns 'up' if Redis is responsive, 'down' otherwise.
   */
  private async checkRedisHealth(): Promise<'up' | 'down'> {
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG' ? 'up' : 'down';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return 'down';
    }
  }

  /**
   * Gathers Redis statistics like memory usage, key count, and uptime.
   * @returns An object containing Redis statistics.
   */
  private async getRedisStats() {
    try {
      const info = await this.redisClient.info();
      const stats = this.parseRedisInfo(info);
      return stats;
    } catch (error) {
      console.error('Failed to retrieve Redis stats:', error);
      return { error: 'Unable to retrieve Redis stats' };
    }
  }

  /**
   * Parses Redis INFO command output to extract stats.
   * @param info Redis INFO command output.
   * @returns An object containing parsed Redis stats.
   */
  private parseRedisInfo(info: string) {
    const stats: Record<string, any> = {};
    const lines = info.split('\n');
    lines.forEach(line => {
      if (line && line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key.trim()] = value.trim();
      }
    });

    return {
      keys: stats['db0'] ? parseInt(stats['db0'].split(',')[0].split('=')[1]) : 0,
      memoryUsed: stats['used_memory_human'] || 'N/A',
      uptime: stats['uptime_in_days'] ? `${stats['uptime_in_days']} days` : 'N/A',
      connectedClients: stats['connected_clients'] || 'N/A',
    };
  }
}
