variable "project_id" {
  type = string
}
variable "region" {
  type    = string
  default = "europe-west1"
}
variable "environment" {
  type = string
}
variable "public" {
  type    = bool
  default = false
}
variable "min_instances" {
  type    = number
  default = 0
}
variable "max_instances" {
  type    = number
  default = 10
}
variable "image_tag" {
  type    = string
  default = "latest"
}
variable "custom_domain" {
  type = string
  default = null
  description = "Custom domain name of the deployed application"
}
