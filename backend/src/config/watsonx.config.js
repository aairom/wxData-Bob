/**
 * watsonx.data Configuration
 * 
 * Configuration for connecting to watsonx.data Developer Edition
 */

module.exports = {
  watsonxData: {
    // Base URL for watsonx.data API
    baseUrl: process.env.WATSONX_BASE_URL || 'https://localhost:6443',
    
    // Authentication credentials
    username: process.env.WATSONX_USERNAME || 'ibmlhadmin',
    password: process.env.WATSONX_PASSWORD || 'password',
    instanceId: process.env.WATSONX_INSTANCE_ID || '0000-0000-0000-0000',
    instanceName: process.env.WATSONX_INSTANCE_NAME || '',
    
    // API endpoints
    endpoints: {
      auth: '/lakehouse/api/v3/auth/authenticate',
      ingestion: '/lakehouse/api/v3/lhingestion/api/v1/ingestions',
      catalogs: '/lakehouse/api/v3/catalogs',
      schemas: '/lakehouse/api/v3/schemas',
      tables: '/lakehouse/api/v3/tables',
      queries: '/lakehouse/api/v3/queries',
      engines: '/lakehouse/api/v3/spark_engines'
    },
    
    // Default engine configuration
    defaultEngine: {
      engineId: process.env.WATSONX_ENGINE_ID || 'spark158',
      driverMemory: '4G',
      driverCores: 2,
      executorMemory: '4G',
      executorCores: 2,
      numExecutors: 1
    },
    
    // Default bucket configuration
    defaultBucket: {
      bucketName: process.env.WATSONX_BUCKET_NAME || 'iceberg-bucket',
      bucketType: 'minio'
    },
    
    // Token refresh settings
    tokenRefresh: {
      // Refresh token 5 minutes before expiry
      refreshBeforeExpiry: 5 * 60 * 1000,
      // Default token expiry (1 hour)
      defaultExpiry: 60 * 60 * 1000
    },
    
    // Request timeout (30 seconds)
    timeout: 30000,
    
    // SSL/TLS settings
    ssl: {
      // Set to false for self-signed certificates in development
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  },
  
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

// Made with Bob
