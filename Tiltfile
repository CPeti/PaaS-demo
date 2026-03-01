# -*- mode: Python -*-
# Tiltfile for PaaS Demo – local Kubernetes hot-reload development
#
# Prerequisites:
#   - A local k8s cluster (Docker Desktop, kind, minikube, …)
#   - helm CLI on PATH
#   - tilt CLI
#
# Usage:
#   tilt up

NAMESPACE = "paas-demo"

# Ensure the namespace exists before deploying any chart
k8s_yaml(blob("""
apiVersion: v1
kind: Namespace
metadata:
  name: %s
""" % NAMESPACE))

k8s_resource(
    new_name = 'namespace',
    objects = ['%s:namespace' % NAMESPACE],
    labels = ['infra'],
)

# helm() renders the chart to YAML; k8s_yaml() applies it.
# ---------------------------------------------------------------------------

k8s_yaml(helm(
    './charts/infra',
    name = 'infra',
    namespace = NAMESPACE,
    values = ['./charts/infra/values.yaml'],
))

k8s_resource('infra-postgres',
    port_forwards = ['5432:5432'],
    resource_deps = ['namespace'],
    labels = ['infra'],
)

k8s_resource('infra-minio',
    port_forwards = ['9000:9000', '9001:9001'],
    resource_deps = ['namespace'],
    labels = ['infra'],
)

# Create the MinIO bucket after MinIO is up.
# Tilt uses helm() which bypasses Helm hooks, so we run this as an explicit
# local_resource. cmd is a list so Tilt passes args directly to kubectl
# without shell interpretation (avoids Windows quote-escaping issues).
local_resource(
    'minio-init',
    cmd = [
        'kubectl', '-n', 'paas-demo', 'exec', 'deploy/infra-minio', '--',
        'sh', '-c',
        'mc alias set local http://localhost:9000 minioadmin minioadmin && mc mb --ignore-existing local/photos && mc anonymous set download local/photos && echo bucket ready',
    ],
    resource_deps = ['infra-minio'],
    labels = ['infra'],
)

# ---------------------------------------------------------------------------
# Backend (FastAPI) – hot reload via uvicorn --reload
# ---------------------------------------------------------------------------

docker_build(
    'paas-demo-backend',
    context = './backend',
    dockerfile = './backend/Dockerfile.dev',
    live_update = [
        sync('./backend/app', '/app/app'),
    ],
)

k8s_yaml(helm(
    './charts/backend',
    name = 'backend',
    namespace = NAMESPACE,
    values = ['./charts/backend/values.yaml'],
))

k8s_resource('backend',
    port_forwards = ['8000:8000'],
    resource_deps = ['infra-postgres', 'infra-minio'],
    labels = ['backend'],
)

# ---------------------------------------------------------------------------
# Frontend (Vite dev server) – HMR hot reload
# ---------------------------------------------------------------------------

docker_build(
    'paas-demo-frontend',
    context = './frontend',
    dockerfile = './frontend/Dockerfile.dev',
    live_update = [
        sync('./frontend/src', '/app/src'),
        sync('./frontend/public', '/app/public'),
        sync('./frontend/index.html', '/app/index.html'),
    ],
)

k8s_yaml(helm(
    './charts/frontend',
    name = 'frontend',
    namespace = NAMESPACE,
    values = ['./charts/frontend/values.yaml'],
    set = ['viteApiUrl=http://localhost:8000'],
))

k8s_resource('frontend',
    port_forwards = ['5173:5173'],
    resource_deps = ['backend'],
    labels = ['frontend'],
)
