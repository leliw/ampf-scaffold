locals {
  app_name = "ampf-scaffold"

  name_prefix = "${var.environment}-${local.app_name}"
  env_prefix  = upper(replace(local.name_prefix, "-", "_"))
  create_app  = !contains(["it", "int", "local", "lcl", "dev"], var.environment)
  bucket_name = "${local.name_prefix}-${random_id.bucket_suffix.hex}"

  env_vars = {}
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
