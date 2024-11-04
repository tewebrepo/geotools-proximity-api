export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || '',
    },
  });
  