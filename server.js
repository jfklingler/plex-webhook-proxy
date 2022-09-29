const axios = require('axios');
const express = require('express');
const multer = require('multer');
const winston = require('winston');
const expressWinston = require('express-winston');

const env = require('./env');

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

const app = express();
app.use(express.json());
app.use(expressWinston.logger({
  level: env.LOG_LEVEL,
  statusLevels: {
    "success": "debug",
    "warn": "warn",
    "error": "error"
  },
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  ignoreRoute: function (req, res) {
    let ignoreHealth = req.path == env.HEALTH_PATH && !env.LOG_HEALTH_REQUESTS
     
    return ignoreHealth;
  }
}));

const upload = multer({
  fileFilter: function (_, _, cb) {
    // Don't care about the thumb in Plex's multipart requests
    cb(null, false);
  }
});

const postUrl = env.POST_URL || `http://localhost:${env.LISTEN_PORT}${env.SELF_TEST_PATH}`;

app.post(env.LISTEN_PATH, upload.single('thumb'), (req, res, _) => {
  try {
    // Grab the "payload" of a multipart/form-data or the body of an application/json
    var content = req.body.payload || req.body;
    var payload = JSON.parse(content);
  } catch (err) {
    let msg = `Error parsing payload '${content}': ${err}`;
    logger.error(msg);
    res.status(400).send(msg);
  }
  
  if (payload) {
    axios.post(postUrl, payload, { params: req.query })
      .then((forwardRes) => {
        logger.debug(`HTTP POST ${postUrl}`);//, { res: forwardRes });
        res.status(forwardRes.status).send(forwardRes.data);
      }).catch((err) => {
        logger.error(err);
        res.status(500).send(err);
      });
  }
});

app.post(env.SELF_TEST_PATH, (req, res) => {
  let dataReceived = {headers: req.headers, queryString: req.query, data: req.body}

  res.send({selfTest: 'OK', dataReceived: dataReceived});
});

// Simple health check endpoint for all of your probing needs
app.get(env.HEALTH_PATH, (_, res) => {
  res.send('OK');
});

app.listen(env.LISTEN_PORT, () => {
  logger.info(`Server listening on port ${env.LISTEN_PORT}`);
  if (!env.POST_URL) logger.warn('POST_URL not defined - using self-test endpoint');
  logger.info(`Proxying requests to ${postUrl}`);
  logger.info('Ready to receive requests')
});

// Trap CTRL-C - node doesn't exit in docker...
process.on('SIGINT', function (code) {
  logger.info('Stopping server');
  process.exit();
});
