import type { TransformableInfo } from 'logform'
import winston from 'winston'

import { env } from '@/config/env.mjs'

// Custom format for console that omits timestamp and service
const consoleFormat = winston.format.printf((info: TransformableInfo) => {
  // Convert info to LogFormatInfo type safely
  const { level, message = '', ...rest } = info

  // Filter out service and timestamp from rest
  const cleanRest = { ...rest }

  // Check if there are remaining properties to log
  const restString = Object.keys(cleanRest).length ? ` ${JSON.stringify(cleanRest)}` : ''

  return `${level}: ${message}${restString}`
})

// Configure the logger
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), consoleFormat),
    }),
  ],
})
