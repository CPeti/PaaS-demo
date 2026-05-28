# Infrastructure-as-Code Guide

This project uses **Terraform** to manage a full-stack photo album deployment on **Railway**. It is designed to be fully automated via a "GitOps" workflow.

## Architecture Overview

The infrastructure consists of four primary services orchestrated within a single Railway project:

1.  **PostgreSQL (`db`)**: Persistent database using a Railway volume. Uses a custom `PGDATA` path to avoid startup conflicts.
2.  **MinIO (`minio`)**: S3-compatible object storage. Deployed via a custom Dockerfile to handle start commands natively.
3.  **Backend (`backend`)**: FastAPI application linked to the `/backend` subdirectory of this repo. Automatically rebuilds on GitHub pushes.
4.  **Frontend (`frontend`)**: Vite/React application linked to the `/frontend` subdirectory. Automatically rebuilds on GitHub pushes.

---

## Configuration & Secrets

### 1. Project Identifiers

Because manual deletions in Railway can cause state conflicts, we use **Hardcoded IDs** for stability. These are defined in the `locals` block of `main.tf`:

- `project_id`: The UUID of your Railway project.
- `env_id`: The UUID of your Railway environment (e.g., "production").

### 2. Secrets Management

Sensitive data is never stored in code. It is distributed across two layers:

#### **Layer A: HCP Terraform (Workspace Variables)**

Manage these in your Workspace under the **Variables** tab:

1.  **Terraform Variables**:
    - `db_password`: Generic password for Postgres.
    - `minio_password`: Root password for MinIO.
    - `backend_secret_key`: Secret for JWT token signing.

2.  **Environment Variables**:
    - `RAILWAY_TOKEN`: Your Personal Access Token.

#### **Layer B: GitHub (Action Secrets)**

Configure these in **GitHub Settings -> Secrets -> Actions**:

- `TF_API_SECRET`: Your HCP Terraform API token used for authentication during the run.

---

## Deployment Workflow (Optimized)

1.  **Code Change**: You push code to the `main` branch.
2.  **Deployment Paths**:
    - **Infrastructure Changes**: If you modify files in the `terraform/` directory, GitHub Actions triggers the `Terraform Apply` workflow. This workflow uses a **parallelism limit of 1** to avoid API rate limiting.
    - **Application Changes**: If you only modify code in `/backend` or `/frontend`, the Terraform workflow is **skipped**. 
3.  **Cloud Sync & Update**:
    - When the Terraform workflow runs, it uses `railway_variable_collection` to update all variables for a service in a single API call, further preventing rate limits.
    - Railway's native CI/CD always detects pushes and starts the Docker builds for the corresponding services.
4.  **Automatic Init**: The `minio-init` service runs to ensure infrastructure readiness (e.g., bucket creation).
