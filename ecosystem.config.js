module.exports = {
  apps: [
    {
      name: 'domeo',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './app',
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        '.next',
        '.git',
        'logs',
        '*.log',
        'public/uploads',
        'prisma/migrations'
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },
    {
      name: 'domeo-staging',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: './app',
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        '.next',
        '.git',
        'logs',
        '*.log',
        'public/uploads',
        'prisma/migrations'
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },
      env: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      error_file: './logs/pm2-staging-error.log',
      out_file: './logs/pm2-staging-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};

