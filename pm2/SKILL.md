---
name: PM2 Process Manager
description: Start, stop, monitor PM2 processes for Spring Boot apps. Use when managing application deployment or process monitoring.
allowed-tools: Bash, Read, Edit, Write
---

# PM2 Process Manager

## Quick Start

**Start the application:**
```bash
pm2 start ecosystem.config.js
```

**Check status:**
```bash
pm2 list
```

**View logs:**

```bash
# be sure to use `--nostream`, otherwise the process will hang
pm2 -n app-name log --nostream --lines 50
```

## Common Commands

### Process Management
- `pm2 start ecosystem.config.js` - Start the application
- `pm2 stop app-name` - Stop the application
- `pm2 restart app-name` - Restart the application
- `pm2 delete app-name` - Remove from PM2 list
- `pm2 list` - List all running processes

### Monitoring & Logs
- `pm2 logs app-name` - View live logs
- `pm2 -n app-name log --nostream --lines 50` - View last 50 log lines
- `pm2 monit` - Open monitoring dashboard
- `pm2 show app-name` - Show detailed process info

### Configuration Management
- `pm2 save` - Save current process list
- `pm2 startup` - Configure auto-start on system boot
- `pm2 reload app-name` - Zero-downtime reload

## Project-Specific Configuration

The `ecosystem.config.js` file is configured for this Spring Boot project:

```javascript
module.exports = {
  apps: [{
    name: 'unuspay-backend',
    script: 'mvn',
    args: 'spring-boot:run',
    cwd: '/Users/junguo/code/unuspay/manage-backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    err_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```
