output "service_url" {
  value       = try(module.app.service_url, null)
  description = "Cloud Run Service public URL"
}
output "firebase_dns_records" {
  value       =  module.app.firebase_dns_records
  description = "Changes required in DNS records"
}
output "service_account_key" {
  value     = local.create_app ? null : module.app.service_account_key
  sensitive = true
}
output "env_file" {
  value = module.app.env_file
}
