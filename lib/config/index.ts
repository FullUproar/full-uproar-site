// Centralized configuration management

interface AppConfig {
  // App
  app: {
    name: string;
    description: string;
    url: string;
    env: 'development' | 'staging' | 'production';
  };
  
  // Database
  database: {
    url: string;
    logQueries: boolean;
  };
  
  // Auth
  auth: {
    secret: string;
    googleClientId: string;
    googleClientSecret: string;
  };
  
  // Storage
  storage: {
    uploadDir: string;
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
  
  // External Services
  services: {
    printify: {
      enabled: boolean;
      apiKey?: string;
      shopId?: string;
    };
  };
  
  // Features
  features: {
    testMode: boolean;
    maintenanceMode: boolean;
    chaosMode: boolean;
  };
  
  // API
  api: {
    rateLimit: {
      enabled: boolean;
      windowMs: number;
      maxRequests: number;
    };
    cors: {
      enabled: boolean;
      origins: string[];
    };
  };
}

class Config {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AppConfig {
    const env = process.env.NODE_ENV || 'development';
    
    return {
      app: {
        name: process.env.NEXT_PUBLIC_APP_NAME || 'Full Uproar',
        description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Chaos, Games, and Fugly Fun',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        env: env as any
      },
      
      database: {
        url: process.env.DATABASE_URL || '',
        logQueries: env === 'development'
      },
      
      auth: {
        secret: process.env.AUTH_SECRET || '',
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      },
      
      storage: {
        uploadDir: process.env.UPLOAD_DIR || './public/uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
        allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp').split(',')
      },
      
      services: {
        printify: {
          enabled: process.env.PRINTIFY_ENABLED === 'true',
          apiKey: process.env.PRINTIFY_API_KEY,
          shopId: process.env.PRINTIFY_SHOP_ID
        }
      },
      
      features: {
        testMode: process.env.NEXT_PUBLIC_TEST_MODE === 'true',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        chaosMode: process.env.NEXT_PUBLIC_CHAOS_MODE === 'true'
      },
      
      api: {
        rateLimit: {
          enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100')
        },
        cors: {
          enabled: process.env.CORS_ENABLED !== 'false',
          origins: (process.env.CORS_ORIGINS || '*').split(',')
        }
      }
    };
  }

  private validateConfig() {
    // Add validation logic here
    if (this.isProduction()) {
      if (!this.config.database.url) {
        throw new Error('DATABASE_URL is required in production');
      }
      if (!this.config.auth.secret) {
        throw new Error('AUTH_SECRET is required in production');
      }
    }
  }

  // Getters
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  // Convenience methods
  isDevelopment(): boolean {
    return this.config.app.env === 'development';
  }

  isProduction(): boolean {
    return this.config.app.env === 'production';
  }

  isTestMode(): boolean {
    return this.config.features.testMode;
  }

  isMaintenanceMode(): boolean {
    return this.config.features.maintenanceMode;
  }

  // Update configuration at runtime (for settings stored in DB)
  updateServiceConfig(service: keyof AppConfig['services'], config: any) {
    this.config.services[service] = {
      ...this.config.services[service],
      ...config
    };
  }
}

// Export singleton instance
export const config = new Config();

// Export specific config sections for convenience
export const appConfig = config.get('app');
export const dbConfig = config.get('database');
export const authConfig = config.get('auth');
export const storageConfig = config.get('storage');
export const servicesConfig = config.get('services');
export const featuresConfig = config.get('features');
export const apiConfig = config.get('api');