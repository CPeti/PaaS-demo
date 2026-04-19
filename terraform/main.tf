terraform {
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

resource "railway_project" "paas_demo" {
  name        = "paas-demo"
  description = "Managed via Terraform"
}

locals {
  env_id = railway_project.paas_demo.default_environment.id
}

# --- DB Service ---
resource "railway_service" "db" {
  name       = "db"
  project_id = railway_project.paas_demo.id
  
  source_image = "postgres:16-alpine"

  volume = {
    name       = "pgdata"
    mount_path = "/var/lib/postgresql/data"
  }
}

resource "railway_variable" "postgres_user" {
  name           = "POSTGRES_USER"
  value          = "postgres"
  environment_id = local.env_id
  service_id     = railway_service.db.id
}

resource "railway_variable" "postgres_password" {
  name           = "POSTGRES_PASSWORD"
  value          = "postgres"
  environment_id = local.env_id
  service_id     = railway_service.db.id
}

resource "railway_variable" "postgres_db" {
  name           = "POSTGRES_DB"
  value          = "paas_demo"
  environment_id = local.env_id
  service_id     = railway_service.db.id
}

resource "railway_variable" "postgres_pgdata" {
  name           = "PGDATA"
  value          = "/var/lib/postgresql/data/pgdata"
  environment_id = local.env_id
  service_id     = railway_service.db.id
}

# --- MinIO Service ---
resource "railway_service" "minio" {
  name       = "minio"
  project_id = railway_project.paas_demo.id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/minio"
}

resource "railway_variable" "minio_root_user" {
  name           = "MINIO_ROOT_USER"
  value          = "minioadmin"
  environment_id = local.env_id
  service_id     = railway_service.minio.id
}

resource "railway_variable" "minio_root_password" {
  name           = "MINIO_ROOT_PASSWORD"
  value          = "minioadmin"
  environment_id = local.env_id
  service_id     = railway_service.minio.id
}

# Add a port variable to expose the S3 API instead of the UI to other services if necessary
resource "railway_variable" "minio_port" {
  name           = "PORT"
  value          = "9000"
  environment_id = local.env_id
  service_id     = railway_service.minio.id
}

# --- MinIO Bucket Init Job ---
resource "railway_service" "minio_job" {
  name               = "minio-init"
  project_id         = railway_project.paas_demo.id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/minio-init"
}

resource "railway_variable" "minio_job_endpoint" {
  name           = "MINIO_ENDPOINT"
  value          = "http://minio.railway.internal:9000"
  environment_id = local.env_id
  service_id     = railway_service.minio_job.id
}

resource "railway_variable" "minio_job_user" {
  name           = "MINIO_ROOT_USER"
  value          = "minioadmin"
  environment_id = local.env_id
  service_id     = railway_service.minio_job.id
}

resource "railway_variable" "minio_job_pass" {
  name           = "MINIO_ROOT_PASSWORD"
  value          = "minioadmin"
  environment_id = local.env_id
  service_id     = railway_service.minio_job.id
}

resource "railway_variable" "minio_job_bucket" {
  name           = "MINIO_BUCKET"
  value          = "photos"
  environment_id = local.env_id
  service_id     = railway_service.minio_job.id
}

# --- Backend Service ---
resource "railway_service" "backend" {
  name       = "backend"
  project_id = railway_project.paas_demo.id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/backend"
}

resource "railway_service_domain" "backend_domain" {
  subdomain      = "lumina-api"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_db_url" {
  name           = "DATABASE_URL"
  value          = "postgresql+asyncpg://postgres:postgres@db.railway.internal:5432/paas_demo"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_minio_endpoint" {
  name           = "MINIO_ENDPOINT"
  value          = "http://minio.railway.internal:9000"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_minio_public" {
  name           = "MINIO_PUBLIC_ENDPOINT"
  value          = "https://${railway_service_domain.minio_domain.domain}"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_minio_ak" {
  name           = "MINIO_ACCESS_KEY"
  value          = "minioadmin"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_minio_sk" {
  name           = "MINIO_SECRET_KEY"
  value          = "minioadmin"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_minio_bucket" {
  name           = "MINIO_BUCKET"
  value          = "photos"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_secret" {
  name           = "SECRET_KEY"
  value          = "super-secret-production-key" # Hardcoded for demo
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_port" {
  name           = "PORT"
  value          = "8000"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable" "backend_frontend_url" {
  name           = "FRONTEND_URL"
  value          = "https://${railway_service_domain.frontend_domain.domain}"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
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
  project_id = railway_project.paas_demo.id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/frontend"
}

resource "railway_service_domain" "frontend_domain" {
  subdomain      = "lumina-app"
  environment_id = local.env_id
  service_id     = railway_service.frontend.id
}

resource "railway_variable" "frontend_api_url" {
  name           = "VITE_API_URL"
  value          = "https://${railway_service_domain.backend_domain.domain}"
  environment_id = local.env_id
  service_id     = railway_service.frontend.id
}

resource "railway_variable" "frontend_port" {
  name           = "PORT"
  value          = "80"
  environment_id = local.env_id
  service_id     = railway_service.frontend.id
}
