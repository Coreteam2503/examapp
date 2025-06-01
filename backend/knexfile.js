module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './data/quiz_app.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations'
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  },
  
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    migrations: {
      directory: './src/migrations'
    }
  }
};
