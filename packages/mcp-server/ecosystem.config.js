module.exports = {
  apps: [{
    name: 'foundry-mcp',
    script: './dist/index-v2.js',
    cwd: '/home/foundry/foundry-mcp-v2/packages/mcp-server',
    env: {
      FOUNDRY_MCP_HTTP_PORT: 31415,
      FOUNDRY_MCP_WS_PORT: 31417,
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/home/foundry/logs/foundry-mcp-error.log',
    out_file: '/home/foundry/logs/foundry-mcp-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
