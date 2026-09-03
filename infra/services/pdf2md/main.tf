locals {
  image_name     = "pdf2markdown"
  service_name   = "pdf2md"
  image_registry = "europe-west3-docker.pkg.dev/development-428212/docker-eu"

  container_image = "${local.image_registry}/${local.image_name}:${var.image_tag}"
  pubsub_topics = {
    REQUEST_TOPIC = {
      topic_name    = "${var.name_prefix}-${local.service_name}-requests"
      push_endpoint = "/pub-sub"
    }
  }
  pubsub_subscriptions = {
    REQUEST_SUBSCRIPTION = "${local.pubsub_topics["REQUEST_TOPIC"].topic_name}-sub"
  }

  service_account_name         = "${var.name_prefix}-${local.service_name}-sa"
  service_account_display_name = "Service Account for Cloud Run - ${var.name_prefix}-${local.service_name}"
  service_account_roles = concat(
    [
      "roles/pubsub.publisher",
      "roles/pubsub.subscriber",
      "roles/iam.serviceAccountTokenCreator",
    ],
    [
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
      "roles/cloudtrace.agent",
    ]
  )

  env_vars_plain = merge(var.env_vars_plain, {
    # for key, topic in local.pubsub_topics :
    # "${key}" => topic.topic_name
    }, !var.create_app ? {
    for key, sub in local.pubsub_subscriptions :
    "${key}" => sub
    } : {}
  )
}

module "service_account" {
  source = "../../modules/service_account"

  project_id            = var.project_id
  account_id            = local.service_account_name
  display_name          = local.service_account_display_name
  service_account_roles = local.service_account_roles
  bucket_names          = [var.bucket_name]
}

module "app" {
  count  = var.create_app ? 1 : 0
  source = "../../modules/cloud_run_service"

  project_id            = var.project_id
  region                = var.region
  name                  = "${var.name_prefix}-${local.service_name}"
  container_image       = local.container_image
  image_registry        = local.image_registry
  service_account_email = module.service_account.email
  public                = var.public
  cpu_limit             = "1"
  memory_limit          = "512Mi"
  env_vars_plain        = local.env_vars_plain
  env_vars_secrets      = {}
}

module "pubsub_topics" {
  source   = "../../modules/pubsub-topic-with-dlq"
  for_each = local.pubsub_topics

  project_id                 = var.project_id
  environment                = var.environment
  topic_name                 = each.value.topic_name
  subscription_name_suffix   = var.create_app ? "push" : "sub"
  push_endpoint              = var.create_app ? "${module.app[0].url}${each.value.push_endpoint}" : null
  push_service_account_email = var.create_app ? module.service_account.email : null
}
