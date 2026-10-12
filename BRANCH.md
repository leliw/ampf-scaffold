# Async task

## Infra

Add topic, subsciption and proper roles.

#### infra/services/app/main.tf

```diff
   service_account_name         = "${var.name_prefix}-${local.service_name}-sa"
   service_account_display_name = "Service Account for Cloud Run - ${var.name_prefix}-${local.service_name}"
   service_account_roles = [
+    "roles/run.invoker",                  # Calls other scripts and Pub/Sub Push endpoints
     "roles/datastore.user",               # Uses Firestore
     "roles/secretmanager.secretAccessor", # Reads secrets 
+    # Pub/Sub
+    "roles/pubsub.publisher",
+    "roles/pubsub.subscriber",
+    "roles/pubsub.viewer",
     # OpenTelemetry
     "roles/logging.logWriter",       # Logi
     "roles/monitoring.metricWriter", # Metryki
     "roles/cloudtrace.agent",        # Trace'y
   ]
-  pubsub_topics        = {}
-  pubsub_subscriptions = {}
+  pubsub_topics = {
+    TASK_NAME = {
+      topic_name    = "${var.name_prefix}-process-item-request"
+      push_endpoint = "/pub-sub/task-processors/process-item"
+    }
+  }
+  pubsub_subscriptions = {
+    TASK_NAME = "${local.pubsub_topics["TASK_NAME"].topic_name}-sub"
+  }
   env_vars_plain = merge(var.env_vars_plain,
     {
       DEFAULT_USER__EMAIL         = "marcin.leliwa@gmail.com"
```

```diff
       GOOGLE_CLOUD_PROJECT = var.project_id
       PROJECT_ID           = var.project_id
       GCP_DATABASE         = google_firestore_database.database.name
+
+      TASK_NAME_TOPIC        = local.pubsub_topics["TASK_NAME"].topic_name
+      TASK_NAME_SUBSCRIPTION = local.pubsub_subscriptions["TASK_NAME"]
+      TASK_RUNNER            = var.create_app ? "PubsubPush" : "PubsubPull"
+
     },
     !var.create_app ? {
       for key, sub in local.pubsub_subscriptions :
```

## Backend

## Frontend
