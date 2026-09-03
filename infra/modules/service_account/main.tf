locals {
  bucket_names = tolist(var.bucket_names)
  has_token_creator_role = contains(var.service_account_roles, "roles/iam.serviceAccountTokenCreator")
  project_roles = setsubtract(var.service_account_roles, ["roles/iam.serviceAccountTokenCreator"])
}

resource "google_service_account" "account" {
  account_id   = var.account_id
  display_name = var.display_name
}
resource "google_project_iam_member" "app_roles" {
  for_each = local.project_roles
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.account.email}"
}
resource "google_service_account_iam_member" "self_token_creator" {
  count              = local.has_token_creator_role ? 1 : 0
  service_account_id = google_service_account.account.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.account.email}"
}
resource "google_storage_bucket_iam_member" "bucket_access" {
  count  = length(local.bucket_names)
  bucket = local.bucket_names[count.index]
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.account.email}"
}
resource "google_service_account_key" "signed_url_key" {
  service_account_id = google_service_account.account.name
}
