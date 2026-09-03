output "service_name" {
  value       = try(module.app[0].name, null)
  description = "Cloud Run service name"
}
output "service_url" {
  value       = try(module.app[0].service_url, null)
  description = "Cloud Run service URL"
}
output "service_account_email" {
  value       = module.service_account.email
  description = "Cloud Run service account email"
}
output "service_account_key" {
  value       = module.service_account.private_key
  description = "Cloud Run service account private key"
  sensitive   = true
}

output "pubsub_topics" {
  value = {
    for key, topic in local.pubsub_topics :
    "${key}" => topic.topic_name
  }
  description = "PubSub topics"
}
output "env_file" {
  value = join("\n", concat(
    [
      for key, val in local.env_vars_plain :
      "${key}=\"${val}\""
      if val != null
    ],
    [""]
  ))
}
