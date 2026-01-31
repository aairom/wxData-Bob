# Deployment Guide

This guide covers deployment options for the watsonx.data Demo Application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Production Considerations](#production-considerations)

## Prerequisites

### General Requirements
- watsonx.data Developer Edition installed and running
- Network access to watsonx.data instance
- Valid credentials for watsonx.data

### Docker Deployment
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### Kubernetes Deployment
- Kubernetes cluster 1.24+
- kubectl configured
- Helm 3.0+ (optional)
- NGINX Ingress Controller (for ingress)
- 8GB RAM minimum across cluster
- 20GB disk space

## Docker Deployment

### Using Docker Compose

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wxData-Bob
   ```

2. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   # watsonx.data Configuration
   WATSONX_BASE_URL=https://your-watsonx-host:9443
   WATSONX_USERNAME=ibmlhadmin
   WATSONX_PASSWORD=your-password
   WATSONX_INSTANCE_ID=your-instance-id
   ```

3. **Build and start services**
   ```bash
   docker-compose up -d
   ```

4. **Verify deployment**
   ```bash
   # Check service status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   
   # Test backend health
   curl http://localhost:3001/health
   
   # Test frontend
   curl http://localhost:3000/health
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Individual Docker Containers

**Build images:**
```bash
# Backend
cd backend
docker build -t wxdata-backend:latest .

# Frontend
cd ../frontend
docker build -t wxdata-frontend:latest .
```

**Run containers:**
```bash
# Backend
docker run -d \
  --name wxdata-backend \
  -p 3001:3001 \
  -e WATSONX_BASE_URL=https://your-host:9443 \
  -e WATSONX_USERNAME=ibmlhadmin \
  -e WATSONX_PASSWORD=your-password \
  wxdata-backend:latest

# Frontend
docker run -d \
  --name wxdata-frontend \
  -p 3000:3000 \
  --link wxdata-backend:backend \
  wxdata-frontend:latest
```

### Docker Commands

```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# View logs
docker-compose logs -f [service-name]

# Scale services
docker-compose up -d --scale backend=3

# Execute commands in container
docker-compose exec backend sh
```

## Kubernetes Deployment

### Prerequisites

1. **Ensure cluster is ready**
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

2. **Install NGINX Ingress Controller** (if not installed)
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
   ```

### Deployment Steps

1. **Build and push Docker images**
   
   ```bash
   # Tag images for your registry
   docker tag wxdata-backend:latest your-registry/wxdata-backend:latest
   docker tag wxdata-frontend:latest your-registry/wxdata-frontend:latest
   
   # Push to registry
   docker push your-registry/wxdata-backend:latest
   docker push your-registry/wxdata-frontend:latest
   ```

2. **Update image references**
   
   Edit `k8s/backend-deployment.yaml` and `k8s/frontend-deployment.yaml`:
   ```yaml
   image: your-registry/wxdata-backend:latest
   ```

3. **Configure secrets**
   
   Edit `k8s/secret.yaml` with your credentials:
   ```yaml
   stringData:
     WATSONX_USERNAME: "your-username"
     WATSONX_PASSWORD: "your-password"
   ```

4. **Update ConfigMap**
   
   Edit `k8s/configmap.yaml` with your watsonx.data URL:
   ```yaml
   data:
     WATSONX_BASE_URL: "https://your-watsonx-host:9443"
   ```

5. **Deploy to Kubernetes**
   
   ```bash
   # Create namespace
   kubectl apply -f k8s/namespace.yaml
   
   # Deploy ConfigMap and Secret
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   
   # Deploy backend
   kubectl apply -f k8s/backend-deployment.yaml
   
   # Deploy frontend
   kubectl apply -f k8s/frontend-deployment.yaml
   
   # Deploy ingress
   kubectl apply -f k8s/ingress.yaml
   ```

6. **Verify deployment**
   
   ```bash
   # Check pods
   kubectl get pods -n wxdata-demo
   
   # Check services
   kubectl get svc -n wxdata-demo
   
   # Check ingress
   kubectl get ingress -n wxdata-demo
   
   # View logs
   kubectl logs -f deployment/wxdata-backend -n wxdata-demo
   kubectl logs -f deployment/wxdata-frontend -n wxdata-demo
   ```

7. **Access the application**
   
   ```bash
   # Get ingress IP
   kubectl get ingress -n wxdata-demo
   
   # Add to /etc/hosts
   echo "<INGRESS-IP> wxdata-demo.local" | sudo tee -a /etc/hosts
   
   # Access application
   # http://wxdata-demo.local
   ```

### Kubernetes Commands

```bash
# Scale deployments
kubectl scale deployment wxdata-backend --replicas=3 -n wxdata-demo

# Update deployment
kubectl set image deployment/wxdata-backend backend=your-registry/wxdata-backend:v2 -n wxdata-demo

# Rollback deployment
kubectl rollout undo deployment/wxdata-backend -n wxdata-demo

# View deployment history
kubectl rollout history deployment/wxdata-backend -n wxdata-demo

# Port forward for testing
kubectl port-forward svc/wxdata-backend 3001:3001 -n wxdata-demo
kubectl port-forward svc/wxdata-frontend 3000:80 -n wxdata-demo

# Execute commands in pod
kubectl exec -it deployment/wxdata-backend -n wxdata-demo -- sh

# Delete all resources
kubectl delete namespace wxdata-demo
```

### Helm Deployment (Optional)

Create a Helm chart for easier management:

```bash
# Create Helm chart
helm create wxdata-demo

# Install chart
helm install wxdata-demo ./wxdata-demo -n wxdata-demo --create-namespace

# Upgrade chart
helm upgrade wxdata-demo ./wxdata-demo -n wxdata-demo

# Uninstall chart
helm uninstall wxdata-demo -n wxdata-demo
```

## Production Considerations

### Security

1. **Use Secrets Management**
   - Use Kubernetes Secrets or external secret managers (Vault, AWS Secrets Manager)
   - Never commit secrets to version control
   - Rotate credentials regularly

2. **Network Security**
   - Enable TLS/SSL for all communications
   - Use Network Policies to restrict pod-to-pod communication
   - Configure firewall rules

3. **Container Security**
   - Run containers as non-root users
   - Use minimal base images
   - Scan images for vulnerabilities
   - Keep images updated

### High Availability

1. **Multiple Replicas**
   ```yaml
   spec:
     replicas: 3
   ```

2. **Pod Disruption Budgets**
   ```yaml
   apiVersion: policy/v1
   kind: PodDisruptionBudget
   metadata:
     name: wxdata-backend-pdb
   spec:
     minAvailable: 2
     selector:
       matchLabels:
         app: wxdata-demo
         component: backend
   ```

3. **Resource Limits**
   ```yaml
   resources:
     requests:
       memory: "256Mi"
       cpu: "250m"
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

### Monitoring

1. **Health Checks**
   - Liveness probes configured
   - Readiness probes configured
   - Startup probes for slow-starting containers

2. **Logging**
   - Centralized logging (ELK, Splunk, CloudWatch)
   - Structured logging format
   - Log rotation and retention policies

3. **Metrics**
   - Prometheus metrics endpoint
   - Grafana dashboards
   - Alert rules for critical metrics

### Backup and Recovery

1. **Database Backups**
   - Regular automated backups
   - Test restore procedures
   - Off-site backup storage

2. **Configuration Backups**
   - Version control for all configurations
   - Document deployment procedures
   - Maintain rollback plans

### Performance Optimization

1. **Caching**
   - Enable Redis for session storage
   - Configure CDN for static assets
   - Implement API response caching

2. **Load Balancing**
   - Use Kubernetes Service load balancing
   - Configure external load balancer
   - Implement connection pooling

3. **Auto-scaling**
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: wxdata-backend-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: wxdata-backend
     minReplicas: 2
     maxReplicas: 10
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
   ```

## Troubleshooting

### Common Issues

1. **Connection to watsonx.data fails**
   - Verify network connectivity
   - Check credentials
   - Verify SSL certificate trust

2. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n wxdata-demo
   kubectl logs <pod-name> -n wxdata-demo
   ```

3. **Service not accessible**
   ```bash
   kubectl get svc -n wxdata-demo
   kubectl describe svc <service-name> -n wxdata-demo
   ```

4. **Image pull errors**
   - Verify image exists in registry
   - Check image pull secrets
   - Verify registry credentials

### Debug Commands

```bash
# Check pod events
kubectl get events -n wxdata-demo --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n wxdata-demo
kubectl top nodes

# Network debugging
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- /bin/bash

# DNS debugging
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup wxdata-backend.wxdata-demo.svc.cluster.local
```

## Support

For issues and questions:
- Check application logs
- Review watsonx.data documentation
- Contact support team

## Made with Bob