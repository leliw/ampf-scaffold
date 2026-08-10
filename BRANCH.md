# Branch - infra

## File structure

- _root_ - one definition for the whole application, it uses `services`
- `modules` - universal module definitions (the same for all projects)
- `services` - service definitions, they use `modules`
- `env` - environment definitions and outputs

### _root_

### Modules

### Services

### Env

Standard environment names:

- `prod` - production
- `stg` - staging (preproduction)
- `uat` - user acceptance tests
- `int` - environment required for integration tests
- `dev` - environment required for local development
- `local` - local or partially local run

Files in each environment subdirectory:

Inputs:

- `terraform.tfvars` - definitions of application variables
- `backend.hcl` - backend variable definitions, for GCP they are:
  - `bucket` - bucket name, it can be the same for all environments and applications
  - `prefix` - it should contain application and environment names, if the environment is a local run, also add computer or developer name, i.e. `prefix = "knowledge-base/dev/ml"`

Outputs:

- `.env` or `.env.*` - environment file for application or service
- `.gcp_credentials.json` or `.gcp_credentials.*.json` - GCP credentials file for application or service
