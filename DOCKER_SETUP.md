# Docker Compose Setup Guide

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

## Environment Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Credentials

Edit `.env` and set your actual watsonx.data credentials:

```env
WATSONX_BASE_URL=https://your-watsonx-instance:9443
WATSONX_USERNAME=your_username
WATSONX_PASSWORD=your_password
WATSONX_INSTANCE_ID=your_instance_id
```

**IMPORTANT:** Never commit the `.env` file to version control. It contains sensitive credentials.

## Build and Run

### Build Images

```bash
docker-compose build
```

### Start Services

```bash
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Check Status

```bash
docker-compose ps
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## Stop Services

```bash
docker-compose down
```

To also remove volumes:

```bash
docker-compose down -v
```

## Troubleshooting

### Services won't start

1. Check if environment variables are set:
   ```bash
   docker-compose config
   ```

2. Verify credentials are correct in `.env` file

3. Check logs for errors:
   ```bash
   docker-compose logs
   ```

### Connection refused errors

1. Ensure watsonx.data instance is accessible from Docker containers
2. Check firewall rules
3. Verify `WATSONX_BASE_URL` is correct

### Health check failures

Check backend health:
```bash
curl http://localhost:3001/health
```

Check frontend health:
```bash
curl http://localhost:3000/health
```

## Security Notes

1. **Environment Variables:** Always use `.env` file for credentials, never hardcode them
2. **Network Isolation:** Services communicate via Docker network, not exposed ports
3. **Non-root User:** Both containers run as non-root user (UID 1001)
4. **Health Checks:** Automatic health monitoring and restart on failure
5. **Log Management:** Logs are stored in volumes for persistence

## Production Considerations

For production deployments:

1. Use Docker secrets instead of environment variables
2. Implement proper log rotation
3. Use specific image tags instead of `latest`
4. Set up monitoring and alerting
5. Configure resource limits appropriately
6. Use HTTPS with proper certificates
7. Implement backup strategies for persistent data

## Development Mode

For development with hot-reload:

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

# Made with Bob