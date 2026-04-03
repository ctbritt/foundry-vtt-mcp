module.exports = {
  apps: [{
    name: 'foundry-mcp',
    script: './dist/index-v2.js',
    cwd: '/home/foundry/foundry-mcp-v2/packages/mcp-server',
    exec_mode: 'fork',
    instances: 1,
    env: {
      FOUNDRY_MCP_HTTP_PORT: 31415,
      FOUNDRY_MCP_WS_PORT: 31418,
      NODE_ENV: 'production'
    },
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/home/foundry/logs/foundry-mcp-error.log',
    out_file: '/home/foundry/logs/foundry-mcp-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
