locals {
  app_name = "applyfoundry"

  name_prefix     = "${var.environment}-${local.app_name}"
  env_prefix      = upper(replace(local.name_prefix, "-", "_"))
  create_app      = !contains(["it", "int", "local", "lcl", "dev"], var.environment)
  create_services = !contains(["lcl"], var.environment)
  public_services = contains(["it", "int"], var.environment)
  bucket_name     = "${local.name_prefix}-${random_id.bucket_suffix.hex}"

  env_vars = {
    PDF_2_MARKDOWN_REQUESTS_TOPIC = module.pdf2markdown.pubsub_topics["REQUEST_TOPIC"]
    TASK_RUNNER                   = local.create_app ? "PubsubPush" : "PubsubPull"
  }
}

module "app" {
  source           = "./services/app"
  create_app       = local.create_app
  image_tag        = var.image_tag
  project_id       = var.project_id
  name_prefix      = local.name_prefix
  region           = var.region
  environment      = var.environment
  public           = var.public
  bucket_name      = local.bucket_name
  custom_domain    = var.custom_domain
  env_vars_plain   = local.env_vars
  env_vars_secrets = {}
}

module "pdf2markdown" {
  source      = "./services/pdf2md"
  create_app  = local.create_services
  image_tag   = "0.2.0"
  name_prefix = local.name_prefix
  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  public      = local.public_services
  bucket_name = google_storage_bucket.main.name
  env_vars_plain = {
    PROJECT_ID      = var.project_id
    WORKERS         = 3
    GCP_BUCKET_NAME = google_storage_bucket.main.name
  }
  depends_on = [google_project_iam_member.artifact_registry_cross_project]
}

resource "random_id" "bucket_suffix" {
  byte_length = 3
}

resource "google_storage_bucket" "main" {
  project                     = var.project_id
  name                        = local.bucket_name
  location                    = var.region
  storage_class               = "STANDARD"
  force_destroy               = var.environment != "prod"
  uniform_bucket_level_access = true

  lifecycle_rule {
    action { type = "Delete" }
    condition {
      age        = 90
      with_state = "ANY"
    }
  }
}
