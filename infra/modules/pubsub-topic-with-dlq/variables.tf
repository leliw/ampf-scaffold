variable "project_id" {
  type        = string
  description = "ID projektu GCP"
}

variable "region" {
  type        = string
  default     = "europe-west1"
  description = "Region (głównie dla IAM i ewentualnych future features)"
}

variable "topic_name" {
  type        = string
  description = "Name of the main topic"
}

variable "environment" {
  type        = string
  description = "dev / stg / prod – dodawane do nazw"
}

variable "create_dlq" {
  type        = bool
  default     = true
  description = "Whether to create a DLQ and associate it with the subscription"
}

variable "max_delivery_attempts" {
  type        = number
  default     = 5
  description = "Number of delivery attempts before moving a message to the DLQ"
}

variable "ack_deadline_seconds" {
  type    = number
  default = 600 # 10 minutes – safe value for Cloud Run
}

variable "message_retention_duration" {
  type        = string
  default     = "21600s" # 6 hours
  description = "Message retention duration (from 600s to 604800s)"

  validation {
    condition = can(regex("^[0-9]+s$", var.message_retention_duration)) ? (
      tonumber(trimsuffix(var.message_retention_duration, "s")) >= 600 &&
      tonumber(trimsuffix(var.message_retention_duration, "s")) <= 604800
    ) : false
    error_message = "Value must be a number with an 's' suffix in the range of '600s' to '604800s'."
  }
}

variable "subscription_name_suffix" {
  type        = string
  default     = "sub"
  description = "Subscription name suffix (e.g., sub, worker, push)"
}

variable "push_endpoint" {
  type        = string
  default     = null
  description = "If provided, creates a PUSH subscription. Format: https://..."
}

variable "push_service_account_email" {
  type        = string
  default     = null
  description = "Service Account used for push authorization (OIDC token)"
}

variable "labels" {
  type        = map(string)
  default     = {}
  description = "Additional labels"
}
