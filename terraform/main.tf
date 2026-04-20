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
  variables = [
    {
      name  = "POSTGRES_USER"
      value = "postgres"
    },
    {
      name  = "POSTGRES_PASSWORD"
      value = var.db_password
    },
    {
      name  = "POSTGRES_DB"
      value = "postgres"
    },
    {
      name  = "PGDATA"
      value = "/var/lib/postgresql/data/pgdata"
    },
  ]
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
  variables = [
    {
      name  = "MINIO_ROOT_USER"
      value = "minioadmin"
    },
    {
      name  = "MINIO_ROOT_PASSWORD"
      value = var.minio_password
    },
    {
      name  = "PORT"
      value = "9000"
    },
  ]
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
  variables = [
    {
      name  = "MINIO_ENDPOINT"
      value = "http://minio.railway.internal:9000"
    },
    {
      name  = "MINIO_ROOT_USER"
      value = "minioadmin"
    },
    {
      name  = "MINIO_ROOT_PASSWORD"
      value = var.minio_password
    },
    {
      name  = "MINIO_BUCKET"
      value = "photos"
    },
  ]
}

# --- Backend Service ---
resource "railway_service" "backend" {
  name       = "backend"
  project_id = local.project_id

  source_repo        = "CPeti/PaaS-demo"
  source_repo_branch = "main"
  root_directory     = "/backend"

  regions {
    region       = "europe-west4"
    num_replicas = 2
  }
}

resource "railway_service_domain" "backend_domain" {
  subdomain      = "lumina-api"
  environment_id = local.env_id
  service_id     = railway_service.backend.id
}

resource "railway_variable_collection" "backend_vars" {
  environment_id = local.env_id
  service_id     = railway_service.backend.id
  variables = [
    {
      name  = "DATABASE_URL"
      value = "postgresql+asyncpg://postgres:${var.db_password}@db.railway.internal:5432/postgres"
    },
    {
      name  = "MINIO_ENDPOINT"
      value = "http://minio.railway.internal:9000"
    },
    {
      name  = "MINIO_PUBLIC_ENDPOINT"
      value = "https://${railway_service_domain.minio_domain.domain}"
    },
    {
      name  = "MINIO_ACCESS_KEY"
      value = "minioadmin"
    },
    {
      name  = "MINIO_SECRET_KEY"
      value = var.minio_password
    },
    {
      name  = "MINIO_BUCKET"
      value = "photos"
    },
    {
      name  = "SECRET_KEY"
      value = var.backend_secret_key
    },
    {
      name  = "PORT"
      value = "8000"
    },
    {
      name  = "FRONTEND_URL"
      value = "https://${railway_service_domain.frontend_domain.domain}"
    },
  ]
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
  variables = [
    {
      name  = "VITE_API_URL"
      value = "https://${railway_service_domain.backend_domain.domain}"
    },
    {
      name  = "PORT"
      value = "80"
    },
  ]
}
