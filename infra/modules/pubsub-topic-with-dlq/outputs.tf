output "topic_name" {
  value       = google_pubsub_topic.main.name
  description = "Name of the main topic"
}

output "subscription_name" {
  value       = google_pubsub_subscription.main.name
  description = "Name of the main subscription"
}

output "dlq_topic_name" {
  value       = var.create_dlq ? google_pubsub_topic.dlq[0].name : null
  description = "Name of the DLQ topic (if enabled)"
}

output "dlq_subscription_name" {
  value       = var.create_dlq ? google_pubsub_subscription.dlq_inspect[0].name : null
  description = "Subscription for DLQ inspection"
}
