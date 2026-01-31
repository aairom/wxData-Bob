# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (v1.19+)
- kubectl configured to access your cluster
- Docker images built and tagged

## Setup Instructions

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Configure Secrets

**IMPORTANT:** Never commit actual secrets to version control!

Create your secret file from the template:

```bash
cp secret.yaml.template secret.yaml
```

Edit `secret.yaml` and replace the placeholder values with your actual credentials:

```yaml
stringData:
  WATSONX_USERNAME: "your_actual_username"
  WATSONX_PASSWORD: "your_actual_password"
```

Apply the secret:

```bash
kubectl apply -f secret.yaml
```

**Note:** The `secret.yaml` file is in `.gitignore` and should never be committed.

### 3. Configure ConfigMap

Edit `configmap.yaml` to match your environment:

- Update `WATSONX_BASE_URL` with your watsonx.data instance URL
- Update `WATSONX_INSTANCE_ID` with your instance ID
- Update `CORS_ORIGIN` if needed

Apply the ConfigMap:

```bash
kubectl apply -f configmap.yaml
```

### 4. Deploy Backend

```bash
kubectl apply -f backend-deployment.yaml
```

### 5. Deploy Frontend

```bash
kubectl apply -f frontend-deployment.yaml
```

### 6. Configure Ingress (Optional)

If you want to expose the application via Ingress:

```bash
kubectl apply -f ingress.yaml
```

## Verify Deployment

Check pod status:

```bash
kubectl get pods -n wxdata-demo
```

Check services:

```bash
kubectl get svc -n wxdata-demo
```

View logs:

```bash
# Backend logs
kubectl logs -n wxdata-demo -l component=backend -f

# Frontend logs
kubectl logs -n wxdata-demo -l component=frontend -f
```

## Access the Application

### Via LoadBalancer (if configured)

```bash
kubectl get svc -n wxdata-demo wxdata-frontend
```

Access the application at the EXTERNAL-IP shown.

### Via Port Forward

```bash
kubectl port-forward -n wxdata-demo svc/wxdata-frontend 3000:80
```

Access the application at http://localhost:3000

## Security Best Practices

1. **Never commit secrets:** Always use `secret.yaml.template` for version control
2. **Use external secret management:** Consider using Sealed Secrets, HashiCorp Vault, or cloud provider secret managers
3. **Rotate credentials regularly:** Update secrets periodically
4. **Use RBAC:** Implement proper Role-Based Access Control
5. **Network policies:** Implement network policies to restrict pod-to-pod communication
6. **Image scanning:** Scan Docker images for vulnerabilities before deployment

## Troubleshooting

### Pods not starting

Check events:
```bash
kubectl describe pod -n wxdata-demo <pod-name>
```

### Connection issues

Verify ConfigMap and Secret values:
```bash
kubectl get configmap -n wxdata-demo wxdata-config -o yaml
kubectl get secret -n wxdata-demo wxdata-secret -o yaml
```

### Health check failures

Check if the backend is responding:
```bash
kubectl exec -n wxdata-demo <backend-pod-name> -- curl http://localhost:3001/health
```

## Cleanup

To remove all resources:

```bash
kubectl delete namespace wxdata-demo
```

# Made with Bob