# Kubernetes Deployment Guide

## Prerequisites
- Docker installed
- Kubernetes cluster running
- kubectl configured

## Build and Deploy

1. Build the Docker image:
```bash
docker build -t geotools-api:latest .
```

2. Create base64 encoded cities data:
```bash
cat data/big_cities.json | base64 > cities.base64
```

3. Update the ConfigMap:
Replace `${BASE64_ENCODED_CITIES_DATA}` in `kubernetes/configmap.yaml` with the contents of cities.base64

4. Apply Kubernetes manifests:
```bash
kubectl apply -f kubernetes/storage.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
```

## Configuration

### Environment Variables
- PORT: API port (default: 3000)
- STORAGE_MODE: Storage backend ('redis', 'sqlite', or 'auto')
- REDIS_HOST: Redis service hostname
- REDIS_PORT: Redis port
- REDIS_PASSWORD: Redis password (optional)
- SQLITE_PATH: SQLite database path
- BIGCITIES_FILE_PATH: Path to cities data file

### Storage
- SQLite data is persisted using a PersistentVolumeClaim
- Cities data is mounted from a ConfigMap
- Redis credentials are stored in a Secret

## Accessing the API
The API is exposed through a ClusterIP service. To access it:

1. Port forward the service:
```bash
kubectl port-forward service/geotools-api 8080:80
```

2. Access the API at `http://localhost:8080`

## Notes
- The deployment uses a single replica due to SQLite storage
- For production, consider using Redis as the primary storage
- Update the Redis password in storage.yaml for production use
