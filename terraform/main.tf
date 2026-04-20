terraform {
  cloud {
    organization = "cpeti-org"
    workspaces {
      name = "paas-demo"
    }
  }

  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.6.0"
    }
  }
}

provider "railway" {
  # The provider will read the RAILWAY_TOKEN environment variable. 
  # Set it before running terraform apply.
}

locals {
  project_id = "164ad9f1-929f-41e8-9883-4420ac94dc2b"
  env_id     = "3b933788-a2af-4ded-bb26-5fa7df7be6fa"
}

# --- DB Service ---
resource "railway_service" "db" {
  name       = "db"
  project_id = local.project_id

  source_image = "postgres:16-alpine"

  volume = {
    name       = "pgdata"
    mount_path = "/var/lib/postgresql/data"
  }
}

resource "railway_variable_collection" "db_vars" {
  environment_id = local.env_id
  service_id     = railway_service.db.id
  variables = {
    "POSTGRES_USER"     = "postgres"
    "POSTGRES_PASSWORD" = var.db_password
    "POSTGRES_DB"       = "postgres"
    "PGDATA"            = "/var/lib/postgresql/data/pgdata"
  }
}

# --- MinIO Service ---
resource "railway_service" "minio" {
  name       = "minio"
  project_id = local.project_id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/minio"
}

resource "railway_variable_collection" "minio_vars" {
  environment_id = local.env_id
  service_id     = railway_service.minio.id
  variables = {
    "MINIO_ROOT_USER"     = "minioadmin"
    "MINIO_ROOT_PASSWORD" = var.minio_password
    "PORT"                = "9000"
  }
}

# --- MinIO Bucket Init Job ---
resource "railway_service" "minio_job" {
  name       = "minio-init"
  project_id = local.project_id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/minio-init"
}

resource "railway_variable_collection" "minio_job_vars" {
  environment_id = local.env_id
  service_id     = railway_service.minio_job.id
  variables = {
    "MINIO_ENDPOINT"      = "http://minio.railway.internal:9000"
    "MINIO_ROOT_USER"     = "minioadmin"
    "MINIO_ROOT_PASSWORD" = var.minio_password
    "MINIO_BUCKET"        = "photos"
  }
}

# --- Backend Service ---
resource "railway_service" "backend" {
  name       = "backend"
  project_id = local.project_id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/backend"
}

resource "railway_service_domain" "backend_domain" {
  subdomain      = "lumina-api"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable_collection" "backend_vars" {
  environment_id = local.env_id
  service_id     = railway_service.backend.id
  variables = {
    "DATABASE_URL"          = "postgresql+asyncpg://postgres:${var.db_password}@db.railway.internal:5432/postgres"
    "MINIO_ENDPOINT"        = "http://minio.railway.internal:9000"
    "MINIO_PUBLIC_ENDPOINT" = "https://${railway_service_domain.minio_domain.domain}"
    "MINIO_ACCESS_KEY"      = "minioadmin"
    "MINIO_SECRET_KEY"      = var.minio_password
    "MINIO_BUCKET"          = "photos"
    "SECRET_KEY"            = var.backend_secret_key
    "PORT"                  = "8000"
    "FRONTEND_URL"          = "https://${railway_service_domain.frontend_domain.domain}"
  }
}

# Domain for MINIO (so presigned URLs are reachable by the client browser)
resource "railway_service_domain" "minio_domain" {
  subdomain      = "lumina-s3"
  environment_id = local.env_id
  service_id     = railway_service.minio.id
}

# --- Frontend Service ---
resource "railway_service" "frontend" {
  name       = "frontend"
  project_id = local.project_id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/frontend"
}

resource "railway_service_domain" "frontend_domain" {
  subdomain      = "lumina-app"
  environment_id = local.env_id
  service_id     = railway_service.frontend.id
}

resource "railway_variable_collection" "frontend_vars" {
  environment_id = local.env_id
  service_id     = railway_service.frontend.id
  variables = {
    "VITE_API_URL" = "https://${railway_service_domain.backend_domain.domain}"
    "PORT"         = "80"
  }
}
