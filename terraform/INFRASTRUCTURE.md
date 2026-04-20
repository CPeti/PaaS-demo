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

1.  **Terraform Variables** (Top section - _Do **NOT** check the HCL box_):
    - `db_password`: Generic password for Postgres.
    - `minio_password`: Root password for MinIO.
    - `backend_secret_key`: Secret for JWT token signing.

2.  **Environment Variables** (Bottom section):
    - `RAILWAY_TOKEN`: Your Personal Access Token.

#### **Layer B: GitHub (Action Secrets)**

Configure these in **GitHub Settings -> Secrets -> Actions**:

- `TF_API_SECRET`: Your HCP Terraform API token used for authentication during the run.

---

## Deployment Workflow

1.  **Code Change**: You push code to the `main` branch.
2.  **CI Trigger**: GitHub Actions starts the `Terraform Apply` workflow in `.github/workflows/terraform.yml`.
3.  **Cloud Sync**: GitHub connects to **HCP Terraform**. Terraform refreshes its state and calculates the diff.
4.  **Railway Update**:
    - Terraform updates the service configurations and environment variables.
    - Railway's native CI/CD detects the push and starts the Docker builds for the `backend`, `frontend`, `minio`, and `minio-init` containers.
5.  **Automatic Init**: The `minio-init` service runs once to create the `photos` bucket and set it to public, then goes to sleep.
