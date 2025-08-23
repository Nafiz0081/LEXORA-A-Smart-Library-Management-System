const oracledb = require('oracledb');

// Configure Oracle client
try {
  // For thick mode (if Oracle Instant Client is installed)
  // oracledb.initOracleClient({ libDir: 'C:\\instantclient_19_8' });
} catch (err) {
  console.log('Oracle client initialization skipped (thin mode)');
}

// Connection pool configuration
const dbConfig = {
  user: process.env.DB_USER || 'lexora_user',
  password: process.env.DB_PASSWORD || 'lexora_password',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XEPDB1',
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 300,
  stmtCacheSize: 23,
  edition: 'ORA$BASE',
  events: false,
  externalAuth: false,
  homogeneous: true,
  poolAlias: 'default'
};

class Database {
  constructor() {
    this.pool = null;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing Oracle database connection...');
      
      // Create connection pool
      this.pool = await oracledb.createPool(dbConfig);
      
      console.log('✅ Oracle connection pool created successfully');
      console.log(`📊 Pool config: min=${dbConfig.poolMin}, max=${dbConfig.poolMax}`);
      
      // Test connection
      await this.testConnection();
      
      return this.pool;
    } catch (err) {
      console.error('❌ Database initialization failed:', err.message);
      throw err;
    }
  }

  async testConnection() {
    let connection;
    try {
      connection = await this.getConnection();
      const result = await connection.execute('SELECT SYSDATE FROM DUAL');
      console.log('✅ Database connection test successful:', result.rows[0][0]);
    } catch (err) {
      console.error('❌ Database connection test failed:', err.message);
      throw err;
    } finally {
      if (connection) {
        await this.releaseConnection(connection);
      }
    }
  }

  async getConnection() {
    try {
      if (!this.pool) {
        throw new Error('Database pool not initialized');
      }
      return await this.pool.getConnection();
    } catch (err) {
      console.error('❌ Failed to get database connection:', err.message);
      throw err;
    }
  }

  async releaseConnection(connection) {
    try {
      if (connection) {
        await connection.close();
      }
    } catch (err) {
      console.error('❌ Failed to release database connection:', err.message);
    }
  }

  async execute(sql, binds = [], options = {}) {
    let connection;
    try {
      connection = await this.getConnection();
      
      const defaultOptions = {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true
      };
      
      const result = await connection.execute(sql, binds, { ...defaultOptions, ...options });
      return result;
    } catch (err) {
      console.error('❌ Database execution error:', err.message);
      console.error('SQL:', sql);
      console.error('Binds:', binds);
      throw err;
    } finally {
      if (connection) {
        await this.releaseConnection(connection);
      }
    }
  }

  async executeMany(sql, binds = [], options = {}) {
    let connection;
    try {
      connection = await this.getConnection();
      
      const defaultOptions = {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
        batchErrors: true
      };
      
      const result = await connection.executeMany(sql, binds, { ...defaultOptions, ...options });
      return result;
    } catch (err) {
      console.error('❌ Database executeMany error:', err.message);
      throw err;
    } finally {
      if (connection) {
        await this.releaseConnection(connection);
      }
    }
  }

  async callProcedure(procedureName, binds = {}) {
    let connection;
    try {
      connection = await this.getConnection();
      
      const result = await connection.execute(
        `BEGIN ${procedureName}; END;`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      return result;
    } catch (err) {
      console.error('❌ Procedure call error:', err.message);
      console.error('Procedure:', procedureName);
      console.error('Binds:', binds);
      throw err;
    } finally {
      if (connection) {
        await this.releaseConnection(connection);
      }
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.close(10); // 10 seconds timeout
        this.pool = null;
        console.log('✅ Database connection pool closed');
      }
    } catch (err) {
      console.error('❌ Error closing database pool:', err.message);
      throw err;
    }
  }

  getPoolStatus() {
    if (this.pool) {
      return {
        connectionsOpen: this.pool.connectionsOpen,
        connectionsInUse: this.pool.connectionsInUse,
        poolAlias: this.pool.poolAlias,
        status: 'Active'
      };
    }
    return { status: 'Not initialized' };
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;

// Export Oracle types for use in other modules
module.exports.oracledb = oracledb;