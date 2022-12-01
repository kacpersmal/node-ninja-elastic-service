const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'info',
      json: true,
    }),
  ],
});

module.exports = { logger };
