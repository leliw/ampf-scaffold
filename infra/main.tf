locals {
  app_name = "ampf-scaffold"

  name_prefix = "${var.environment}-${local.app_name}"
  env_prefix  = upper(replace(local.name_prefix, "-", "_"))
  create_app  = !contains(["it", "local", "dev"], var.environment)

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
  custom_domain    = var.custom_domain
  env_vars_plain   = local.env_vars
  env_vars_secrets = {}
}
