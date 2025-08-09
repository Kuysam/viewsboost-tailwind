import winston from 'winston';
import fs from 'fs-extra';
import path from 'path';
import { config } from '../config/config.js';

export class Logger {
  constructor(module = 'MediaSourcingAgent') {
    this.module = module;
    this.setupLogger();
  }

  async setupLogger() {
    // Ensure logs directory exists
    await fs.ensureDir(config.storage.logsPath);
    
    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, module, stack }) => {
        const modulePrefix = module ? `[${module}]` : '';
        const logMessage = `${timestamp} ${level.toUpperCase()} ${modulePrefix} ${message}`;
        return stack ? `${logMessage}\n${stack}` : logMessage;
      })
    );

    // Define transports
    const transports = [
      // Console transport
      new winston.transports.Console({
        level: config.logging.level,
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      }),

      // File transport - General logs
      new winston.transports.File({
        filename: path.join(config.storage.logsPath, 'app.log'),
        level: config.logging.level,
        format: logFormat,
        maxsize: config.logging.fileSize,
        maxFiles: config.logging.maxFiles,
        tailable: true
      }),

      // File transport - Error logs only
      new winston.transports.File({
        filename: path.join(config.storage.logsPath, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: config.logging.fileSize,
        maxFiles: config.logging.maxFiles,
        tailable: true
      }),

      // File transport - Download activity
      new winston.transports.File({
        filename: path.join(config.storage.logsPath, 'downloads.log'),
        level: 'info',
        format: logFormat,
        maxsize: config.logging.fileSize,
        maxFiles: config.logging.maxFiles,
        tailable: true
      })
    ];

    // Create logger instance
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: logFormat,
      defaultMeta: { module: this.module },
      transports,
      exitOnError: false
    });

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: path.join(config.storage.logsPath, 'exceptions.log'),
        format: logFormat,
        maxsize: config.logging.fileSize,
        maxFiles: 3
      })
    );

    this.logger.rejections.handle(
      new winston.transports.File({
        filename: path.join(config.storage.logsPath, 'rejections.log'),
        format: logFormat,
        maxsize: config.logging.fileSize,
        maxFiles: 3
      })
    );
  }

  // Standard logging methods
  debug(message, meta = {}) {
    this.logger.debug(message, { module: this.module, ...meta });
  }

  info(message, meta = {}) {
    this.logger.info(message, { module: this.module, ...meta });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { module: this.module, ...meta });
  }

  error(message, meta = {}) {
    this.logger.error(message, { module: this.module, ...meta });
  }

  // Specialized logging methods for media sourcing
  logDownload(action, details) {
    this.info(`Download ${action}`, {
      type: 'download',
      action,
      url: details.url,
      filename: details.filename,
      size: details.size,
      source: details.source,
      duration: details.duration
    });
  }

  logSearchQuery(query, source, results) {
    this.info('Search executed', {
      type: 'search',
      query,
      source,
      resultsCount: results.length,
      timestamp: new Date().toISOString()
    });
  }

  logRateLimit(service, action, details = {}) {
    this.warn(`Rate limit ${action}`, {
      type: 'rateLimit',
      service,
      action,
      requestCount: details.requestCount,
      resetTime: details.resetTime,
      ...details
    });
  }

  logApiError(service, endpoint, error, context = {}) {
    this.error(`API Error: ${service} ${endpoint}`, {
      type: 'apiError',
      service,
      endpoint,
      error: error.message,
      statusCode: error.response?.status,
      responseData: error.response?.data,
      ...context
    });
  }

  logFileOperation(operation, filePath, result, details = {}) {
    const level = result.success ? 'info' : 'error';
    this.logger.log(level, `File ${operation}: ${result.success ? 'SUCCESS' : 'FAILED'}`, {
      type: 'fileOperation',
      operation,
      filePath,
      success: result.success,
      error: result.error,
      size: result.size,
      duration: result.duration,
      ...details
    });
  }

  logValidation(type, filename, result) {
    const level = result.valid ? 'info' : 'warn';
    this.logger.log(level, `${type} validation: ${filename} - ${result.valid ? 'VALID' : 'INVALID'}`, {
      type: 'validation',
      mediaType: type,
      filename,
      valid: result.valid,
      errors: result.errors,
      format: result.format,
      dimensions: result.dimensions,
      size: result.size
    });
  }

  logMetadata(action, fileId, metadata = {}) {
    this.info(`Metadata ${action}`, {
      type: 'metadata',
      action,
      fileId,
      filename: metadata.filename,
      source: metadata.source,
      mediaType: metadata.type
    });
  }

  logQueueOperation(queueName, operation, details = {}) {
    this.debug(`Queue ${operation}: ${queueName}`, {
      type: 'queue',
      queueName,
      operation,
      pending: details.pending,
      size: details.size,
      concurrency: details.concurrency,
      ...details
    });
  }

  // Performance logging
  logPerformance(operation, duration, details = {}) {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      type: 'performance',
      operation,
      duration,
      ...details
    });
  }

  // Create child logger for specific operations
  child(additionalMeta = {}) {
    const childModule = additionalMeta.module || this.module;
    const childLogger = new Logger(childModule);
    childLogger.logger = this.logger.child(additionalMeta);
    return childLogger;
  }

  // Structured logging for analytics
  logAnalytics(event, properties = {}) {
    this.info(`Analytics: ${event}`, {
      type: 'analytics',
      event,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }

  // Session logging
  startSession(sessionId, context = {}) {
    this.info('Session started', {
      type: 'session',
      action: 'start',
      sessionId,
      ...context
    });
  }

  endSession(sessionId, summary = {}) {
    this.info('Session ended', {
      type: 'session',
      action: 'end',
      sessionId,
      duration: summary.duration,
      operations: summary.operations,
      downloads: summary.downloads,
      errors: summary.errors,
      ...summary
    });
  }

  // Utility methods
  async getLogFiles() {
    const logFiles = [];
    const logsDir = config.storage.logsPath;
    
    try {
      const files = await fs.readdir(logsDir);
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          logFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
            created: stats.ctime
          });
        }
      }
    } catch (error) {
      this.error(`Failed to get log files: ${error.message}`);
    }
    
    return logFiles;
  }

  async getRecentLogs(filename = 'app.log', lines = 100) {
    const logPath = path.join(config.storage.logsPath, filename);
    
    try {
      const content = await fs.readFile(logPath, 'utf8');
      const logLines = content.trim().split('\n');
      return logLines.slice(-lines);
    } catch (error) {
      this.error(`Failed to read log file ${filename}: ${error.message}`);
      return [];
    }
  }

  async clearOldLogs(daysOld = 30) {
    const logsDir = config.storage.logsPath;
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    let cleared = 0;
    
    try {
      const files = await fs.readdir(logsDir);
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.remove(filePath);
            cleared++;
            this.info(`Removed old log file: ${file}`);
          }
        }
      }
      
      this.info(`Log cleanup completed: ${cleared} files removed`);
    } catch (error) {
      this.error(`Log cleanup failed: ${error.message}`);
    }
    
    return cleared;
  }

  // Set log level dynamically
  setLevel(level) {
    this.logger.level = level;
    this.logger.transports.forEach(transport => {
      if (transport.level !== 'error') { // Don't change error-only transport
        transport.level = level;
      }
    });
    this.info(`Log level changed to: ${level}`);
  }

  // Get current configuration
  getConfig() {
    return {
      level: this.logger.level,
      module: this.module,
      transports: this.logger.transports.length,
      logsPath: config.storage.logsPath
    };
  }
}