/**
 * Monitoring Service
 * 
 * Collects and provides system metrics, resource utilization, and performance analytics
 */

const os = require('os');
const axios = require('axios');
const config = require('../config/watsonx.config');
const authService = require('./authService');
const logger = require('../utils/logger');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        failed: 0,
        byEndpoint: {}
      },
      performance: {
        avgResponseTime: 0,
        responseTimes: []
      },
      system: {
        startTime: Date.now(),
        lastUpdate: Date.now()
      }
    };

    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  /**
   * Start periodic metrics collection
   */
  startMetricsCollection() {
    // Update system metrics every 5 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 5000);

    logger.info('Monitoring service started - collecting metrics every 5 seconds');
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics() {
    this.metrics.system = {
      ...this.metrics.system,
      lastUpdate: Date.now(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        loadAverage: os.loadavg(),
        usage: this.getCPUUsage()
      },
      platform: {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release()
      }
    };
  }

  /**
   * Get CPU usage percentage
   */
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  /**
   * Record API request
   */
  recordRequest(endpoint, success, responseTime) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track by endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = {
        total: 0,
        success: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: []
      };
    }

    const endpointMetrics = this.metrics.requests.byEndpoint[endpoint];
    endpointMetrics.total++;
    
    if (success) {
      endpointMetrics.success++;
    } else {
      endpointMetrics.failed++;
    }

    // Track response times (keep last 100)
    if (responseTime !== undefined) {
      this.metrics.performance.responseTimes.push(responseTime);
      if (this.metrics.performance.responseTimes.length > 100) {
        this.metrics.performance.responseTimes.shift();
      }

      endpointMetrics.responseTimes.push(responseTime);
      if (endpointMetrics.responseTimes.length > 100) {
        endpointMetrics.responseTimes.shift();
      }

      // Calculate average response time
      this.metrics.performance.avgResponseTime = 
        this.metrics.performance.responseTimes.reduce((a, b) => a + b, 0) / 
        this.metrics.performance.responseTimes.length;

      endpointMetrics.avgResponseTime = 
        endpointMetrics.responseTimes.reduce((a, b) => a + b, 0) / 
        endpointMetrics.responseTimes.length;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    this.updateSystemMetrics();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        failed: this.metrics.requests.failed,
        successRate: this.metrics.requests.total > 0 
          ? ((this.metrics.requests.success / this.metrics.requests.total) * 100).toFixed(2)
          : 0
      },
      performance: {
        avgResponseTime: this.metrics.performance.avgResponseTime.toFixed(2),
        recentResponseTimes: this.metrics.performance.responseTimes.slice(-20)
      },
      system: this.metrics.system,
      endpoints: Object.keys(this.metrics.requests.byEndpoint).map(endpoint => ({
        endpoint,
        ...this.metrics.requests.byEndpoint[endpoint],
        avgResponseTime: this.metrics.requests.byEndpoint[endpoint].avgResponseTime.toFixed(2),
        successRate: this.metrics.requests.byEndpoint[endpoint].total > 0
          ? ((this.metrics.requests.byEndpoint[endpoint].success / this.metrics.requests.byEndpoint[endpoint].total) * 100).toFixed(2)
          : 0
      }))
    };
  }

  /**
   * Get watsonx.data health status
   */
  async getWatsonxHealth() {
    try {
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v3/health`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      return {
        status: 'healthy',
        connected: true,
        details: response.data
      };
    } catch (error) {
      logger.error('Failed to get watsonx.data health', { error: error.message });
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData() {
    const metrics = this.getMetrics();
    const watsonxHealth = await this.getWatsonxHealth();

    return {
      ...metrics,
      watsonx: watsonxHealth,
      health: {
        overall: watsonxHealth.connected && metrics.system.memory.usagePercent < 90 ? 'healthy' : 'degraded',
        components: {
          api: metrics.requests.successRate > 95 ? 'healthy' : 'degraded',
          memory: metrics.system.memory.usagePercent < 90 ? 'healthy' : 'warning',
          watsonx: watsonxHealth.status
        }
      }
    };
  }

  /**
   * Get real-time metrics for streaming
   */
  getRealTimeMetrics() {
    return {
      timestamp: Date.now(),
      cpu: this.metrics.system.cpu?.usage || 0,
      memory: this.metrics.system.memory?.usagePercent || 0,
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        failed: this.metrics.requests.failed
      },
      performance: {
        avgResponseTime: this.metrics.performance.avgResponseTime.toFixed(2)
      }
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        failed: 0,
        byEndpoint: {}
      },
      performance: {
        avgResponseTime: 0,
        responseTimes: []
      },
      system: {
        startTime: Date.now(),
        lastUpdate: Date.now()
      }
    };

    logger.info('Metrics reset');
  }
}

// Export singleton instance
module.exports = new MonitoringService();

// Made with Bob