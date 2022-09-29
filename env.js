module.exports = {
  LISTEN_PORT: process.env.LISTEN_PORT || 8080,
  LISTEN_PATH: process.env.LISTEN_PATH || '/',
  SELF_TEST_PATH: process.env.SELF_TEST_PATH || '/self-test',

  HEALTH_PATH: process.env.HEALTH_PATH || '/healthz',
  LOG_HEALTH_REQUESTS: Boolean(process.env.LOG_HEALTH_REQUESTS),

  POST_URL: process.env.POST_URL,

  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
