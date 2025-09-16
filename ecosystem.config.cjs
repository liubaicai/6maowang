const { resolve } = require('path');

module.exports = {
  apps: [
    {
      name: '6maowang',
      script: './.output/server/index.mjs',
      exec_mode: 'cluster',
      instances: 1,
      watch: false,
      out_file: 'logs/app.out.log',
      error_file: 'logs/app.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        NUXT_SESSION_PASSWORD: 'c0f8c469e4e74843b23215a397f8d9d7',
        ADMIN_PASSWORD: 'admin',
        MAX_FILE_SIZE: '30',
        DATABASE_PATH: './data/app.sqlite',
        PORT: '8060',
      },
    },
  ],
};


