output "frontend_url" {
  description = "The public URL of the frontend"
  value       = "https://${railway_service_domain.frontend_domain.domain}"
}

output "backend_url" {
  description = "The public URL of the API"
  value       = "https://${railway_service_domain.backend_domain.domain}"
}

output "minio_url" {
  description = "The public URL of the S3 store (MinIO)"
  value       = "https://${railway_service_domain.minio_domain.domain}"
}

output "minio_console_notes" {
  description = "Notes on MinIO console"
  value       = "You may need to override the MinIO start command via Railway Dashboard if it doesn't start properly."
}
