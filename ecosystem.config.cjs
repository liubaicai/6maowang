module.exports = {
  apps: [
    {
      name: '6maowang',
      script: 'src/server.js',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        SESSION_SECRET: process.env.SESSION_SECRET || 'change_this_session_secret',
      },
      out_file: 'logs/app.out.log',
      error_file: 'logs/app.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '512M',
    },
  ],
};


