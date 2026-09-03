data "google_project" "current" {
  project_id = var.project_id
}


resource "google_project_iam_member" "artifact_registry_cross_project" {
  project = "development-428212"
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:service-${data.google_project.current.number}@serverless-robot-prod.iam.gserviceaccount.com"
}
