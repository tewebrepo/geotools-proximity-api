export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  storage: {
    mode: process.env.STORAGE_MODE || 'auto', // 'redis', 'sqlite', or 'auto'
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || '',
    },
    sqlite: {
      path: process.env.SQLITE_PATH || 'data/locations.db',
    },
  },
});
