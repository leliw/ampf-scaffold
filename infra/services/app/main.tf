locals {
  service_name   = "app"
  image_name     = "ampf-scaffold"
  image_registry = "europe-west3-docker.pkg.dev/development-428212/docker-eu"

  create_custom_domain         = var.create_app && var.public && var.custom_domain != null
  container_image              = "${local.image_registry}/${local.image_name}:${var.image_tag}"
  service_account_name         = "${var.name_prefix}-${local.service_name}-sa"
  service_account_display_name = "Service Account for Cloud Run - ${var.name_prefix}-${local.service_name}"
  service_account_roles = [
    "roles/logging.logWriter",       # Logi
    "roles/monitoring.metricWriter", # Metryki
    "roles/cloudtrace.agent",        # Trace'y
  ]
  pubsub_topics        = {}
  pubsub_subscriptions = {}
  env_vars_plain = merge(var.env_vars_plain,
    {
      GOOGLE_CLOUD_PROJECT = var.project_id
      PROJECT_ID           = var.project_id
      WORKERS              = 3
    },
    !var.create_app ? {
      for key, sub in local.pubsub_subscriptions :
      "${key}_NAME" => sub
    } : {}
  )
}

module "service_account" {
  source = "../../modules/service_account"

  project_id            = var.project_id
  account_id            = local.service_account_name
  display_name          = local.service_account_display_name
  service_account_roles = local.service_account_roles
}

module "app" {
  count  = var.create_app ? 1 : 0
  source = "../../modules/cloud_run_service"

  name                  = "${var.name_prefix}-${local.service_name}"
  project_id            = var.project_id
  container_image       = local.container_image
  image_registry        = local.image_registry
  service_account_email = module.service_account.email
  region                = var.region
  public                = var.public
  cpu_limit             = "250m"
  memory_limit          = "512Mi"
  env_vars_plain        = local.env_vars_plain
  env_vars_secrets      = var.env_vars_secrets
}

module "pubsub_topics" {
  source   = "../../modules/pubsub-topic-with-dlq"
  for_each = local.pubsub_topics

  project_id               = var.project_id
  environment              = var.environment
  topic_name               = each.value.topic_name
  subscription_name_suffix = var.create_app ? "push" : "sub"
  push_endpoint            = var.create_app ? try("${module.app[0].url}/${each.value.push_endpoint}", null) : null
}

module "custom_domain" {
  count  = local.create_custom_domain ? 1 : 0
  source = "../../modules/custom_domain"

  project_id    = var.project_id
  region        = var.region
  service_id    = try(module.app[0].name, null)
  custom_domain = var.custom_domain
}
