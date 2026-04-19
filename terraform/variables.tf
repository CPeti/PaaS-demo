variable "db_password" {
  description = "Password for the Postgres database"
  type        = string
  sensitive   = true
}

variable "minio_password" {
  description = "Root password for MinIO object storage"
  type        = string
  sensitive   = true
}

variable "backend_secret_key" {
  description = "JWT Secret Key for the FastAPI backend"
  type        = string
  sensitive   = true
}
