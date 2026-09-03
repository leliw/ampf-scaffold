variable "project_id" {
  type = string
}
variable "region" {
  type = string
}
variable "environment" {
  type = string
}
variable "name_prefix" {
  type = string
}

variable "create_app" {
  type = bool
}
variable "image_tag" {
  type = string
}
variable "public" {
  type    = bool
  default = false
}
variable "bucket_name" {
  type    = string
  default = null
}
variable "env_vars_plain" {
  type = map(string)
}
