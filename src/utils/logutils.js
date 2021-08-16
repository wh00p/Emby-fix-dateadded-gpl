/* eslint-disable linebreak-style */
/* eslint-disable max-len */
'use strict';
const winston = require('winston');
const path = require('path');
const {splat, combine, timestamp, printf} = winston.format;
const FS = require('fs');
require('winston-daily-rotate-file');

module.exports = function(_fileName) {
  let fileName = '';

  fileName = path.basename(_fileName).split('.').slice(0, -1).join('.');

  if (!FS.existsSync('./logs/' + fileName + '/')) {
    FS.mkdirSync('./logs/' + fileName + '/', {recursive: true});
  }

  const datePattern = 'YYYY-MM-DD';

  const logger =
  winston.createLogger({
    level: 'debug',
    format: combine(
        splat(),
        timestamp({
          format: 'DD/MM/YYYY HH:mm:ss:ms',
        }),
        printf((info) => `${info.timestamp} ${info.level}: ${info.message}`+(info.splat!==undefined?`${info.splat}`:' ')),
    ),
    transports: [
      new winston.transports.DailyRotateFile({createSymlink: true, symlinkName: fileName + '.error.log', extension: '.error.log', datePattern: datePattern, filename: './logs/' + fileName + '/' + '%DATE%_' + fileName, level: 'error'}), // errors only
      new winston.transports.DailyRotateFile({createSymlink: true, symlinkName: fileName + '.log', extension: '.log', datePattern: datePattern, filename: './logs/' + fileName + '/' + '%DATE%_' + fileName}), // all logs
    ],

  });

  return logger;
};
