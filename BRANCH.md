# Branch - infra

## File structure

- _root_ - one definition for the whole application, it uses `services`
- `modules` - universal module definitions (the same for all projects)
- `services` - service definitions, they use `modules`
- `env` - environment definitions and outputs

### _root_

Common definition for all services.

- [variables.tf](./infra/variables.tf)
- [main.tf](./infra/main.tf)
- [outputs.tf](./infra/outputs.tf)
- [artifact_registry.tf](./infra/artifact_registry.tf) - definition of Docker image registry
- [required_apis.tf](./infra/required_apis.tf) - definitions of required APIs

### Modules

- [cloud_run_service](./infra/modules/cloud_run_service)
- [custom_domain](./infra/modules/custom_domain)
- [pubsub-topic-with-dlq](./infra/modules/pubsub-topic-with-dlq)
- [secret_password](./infra/modules/secret_password)
- [service_account](./infra/modules/service_account)
- [storage_bucket](./infra/modules/storage_bucket)

### Services

Folders with service definitions. At least one folder named "app" should exist.

- [app/variables.tf](./infra/services/app/variables.tf)
- [app/main.tf](./infra/services/app/main.tf)
- [app/outputs.tf](./infra/services/app/outputs.tf)

### Env

Standard environment names:

- `prod` - production
- `stg` - staging (preproduction)
- `uat` - user acceptance tests
- `int` - environment required for integration tests
- `dev` - environment required for local development
- `lcl` - local or partially local run

Files in each environment subdirectory:

Inputs:

- `terraform.tfvars` - definitions of application variables
- `backend.hcl` - backend variable definitions, for GCP they are:
  - `bucket` - bucket name, it can be the same for all environments and applications
  - `prefix` - it should contain application and environment names, if the environment is a local run, also add computer or developer name, i.e. `prefix = "knowledge-base/dev/ml"`

Outputs:

- `.env` or `.env.*` - environment file for application or service
- `.gcp_credentials.json` or `.gcp_credentials.*.json` - GCP credentials file for application or service

Deploy an environment:

```bash
cd infra
./deploy.sh <env>
cd ..
```

Destroy an environment:

```bash
cd infra
./destroy.sh <env>
cd ..
```
