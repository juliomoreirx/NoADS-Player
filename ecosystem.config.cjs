module.exports = {
  apps: [{
    name: "kick-backend",
    script: "./backend/server.js",
    instances: 1, // Não suba em 'max' por causa do Puppeteer
    autorestart: true,
    watch: false,
    max_memory_restart: '1G', // Previne memory leak do headless chrome
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};