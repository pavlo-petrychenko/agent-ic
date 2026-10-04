{{- define "agent-ic.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "agent-ic.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "agent-ic.componentName" -}}
{{- printf "%s-%s" (include "agent-ic.fullname" .root) .component | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "agent-ic.selectorLabels" -}}
app.kubernetes.io/name: {{ include "agent-ic.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "agent-ic.labels" -}}
{{ include "agent-ic.selectorLabels" . }}
app.kubernetes.io/part-of: {{ include "agent-ic.name" .root }}
app.kubernetes.io/version: {{ .root.Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .root.Chart.Name .root.Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{- define "agent-ic.backendTag" -}}
{{- default .Chart.AppVersion .Values.image.backend.tag -}}
{{- end -}}

{{- define "agent-ic.backendImage" -}}
{{- printf "%s:%s" .Values.image.backend.repository (include "agent-ic.backendTag" .) -}}
{{- end -}}

{{- define "agent-ic.webImage" -}}
{{- printf "%s:%s" .Values.image.web.repository (default .Chart.AppVersion .Values.image.web.tag) -}}
{{- end -}}

{{- define "agent-ic.secretEnv" -}}
- name: {{ .name }}
  valueFrom:
    secretKeyRef:
      name: {{ .secret }}
      key: {{ .key }}
      {{- if .optional }}
      optional: true
      {{- end }}
{{- end -}}

{{- define "agent-ic.secretKeysEnv" -}}
{{- $secret := .secret -}}
{{- $optional := .optional | default false -}}
{{- range $env, $key := $secret.keys }}
{{ include "agent-ic.secretEnv" (dict "name" $env "secret" $secret.name "key" $key "optional" $optional) }}
{{- end }}
{{- end -}}

{{- define "agent-ic.databaseUrl" -}}
{{- printf "postgres://$(%s):$(%s)@%s:%v/%s" .username .password .host .port .name -}}
{{- end -}}

{{- define "agent-ic.redisUrl" -}}
{{- printf "redis://:$(%s)@%s:%v" .password .host .port -}}
{{- end -}}

{{- define "agent-ic.databaseCredentialsEnv" -}}
{{- $secret := .secret -}}
{{- include "agent-ic.secretEnv" (dict "name" (printf "%s_USERNAME" .prefix) "secret" $secret.name "key" $secret.usernameKey) }}
{{ include "agent-ic.secretEnv" (dict "name" (printf "%s_PASSWORD" .prefix) "secret" $secret.name "key" $secret.passwordKey) }}
{{- end -}}

{{- define "agent-ic.backendEnv" -}}
{{- $root := .root -}}
{{- $workload := .workload -}}
{{- $values := $root.Values -}}
{{- $config := $values.config -}}
{{- $database := $values.connections.database -}}
{{- $redis := $values.connections.redis -}}
{{- $secrets := $values.secrets -}}
{{- $langfuse := $config.langfuse -}}
- name: NODE_ENV
  value: {{ $config.nodeEnv | quote }}
- name: APP_VERSION
  value: {{ include "agent-ic.backendTag" $root | quote }}
- name: PUBLIC_URL
  value: {{ $config.publicUrl | quote }}
- name: LOG_LEVEL
  value: {{ $config.logLevel | quote }}
- name: HTTP_HOST
  value: {{ $config.httpHost | quote }}
- name: {{ $workload.portEnv }}
  value: {{ $workload.port | quote }}
- name: DATABASE_POOL_MAX
  value: {{ $config.databasePoolMax | quote }}
- name: S3_ENDPOINT
  value: {{ $config.s3.endpoint | quote }}
- name: S3_REGION
  value: {{ $config.s3.region | quote }}
- name: S3_BUCKET
  value: {{ $config.s3.bucket | quote }}
- name: S3_FORCE_PATH_STYLE
  value: {{ $config.s3.forcePathStyle | quote }}
- name: EMAIL_FROM
  value: {{ $config.email.from | quote }}
{{- with $config.email.smtp }}
- name: SMTP_HOST
  value: {{ .host | quote }}
- name: SMTP_PORT
  value: {{ .port | quote }}
{{- end }}
- name: LLM_BASE_URL
  value: {{ $config.llm.baseUrl | quote }}
- name: EMBEDDING_MODEL
  value: {{ $config.llm.embeddingModel | quote }}
- name: OTEL_SDK_DISABLED
  value: {{ not $config.telemetry.enabled | quote }}
{{- if $config.telemetry.enabled }}
- name: OTEL_EXPORTER_OTLP_ENDPOINT
  value: {{ $config.telemetry.endpoint | quote }}
{{- end }}
- name: OTEL_SERVICE_NAMESPACE
  value: {{ $config.telemetry.serviceNamespace | quote }}
- name: OTEL_SERVICE_NAME
  value: {{ .component | quote }}
- name: LANGFUSE_MODE
  value: {{ $langfuse.mode | quote }}
- name: LANGFUSE_SAMPLE_RATE
  value: {{ $langfuse.sampleRate | quote }}
{{ include "agent-ic.databaseCredentialsEnv" (dict "prefix" "DATABASE_APP" "secret" $secrets.databaseApp) }}
{{ include "agent-ic.databaseCredentialsEnv" (dict "prefix" "DATABASE_SYSTEM" "secret" $secrets.databaseSystem) }}
{{ include "agent-ic.secretEnv" (dict "name" "REDIS_QUEUE_PASSWORD" "secret" $secrets.redisQueue.name "key" $secrets.redisQueue.passwordKey) }}
{{ include "agent-ic.secretEnv" (dict "name" "REDIS_CACHE_PASSWORD" "secret" $secrets.redisCache.name "key" $secrets.redisCache.passwordKey) }}
- name: DATABASE_URL
  value: {{ include "agent-ic.databaseUrl" (dict "username" "DATABASE_APP_USERNAME" "password" "DATABASE_APP_PASSWORD" "host" $database.host "port" $database.port "name" $database.name) | quote }}
- name: DATABASE_SYSTEM_URL
  value: {{ include "agent-ic.databaseUrl" (dict "username" "DATABASE_SYSTEM_USERNAME" "password" "DATABASE_SYSTEM_PASSWORD" "host" $database.host "port" $database.port "name" $database.name) | quote }}
- name: REDIS_QUEUE_URL
  value: {{ include "agent-ic.redisUrl" (dict "password" "REDIS_QUEUE_PASSWORD" "host" $redis.queue.host "port" $redis.queue.port) | quote }}
- name: REDIS_CACHE_URL
  value: {{ include "agent-ic.redisUrl" (dict "password" "REDIS_CACHE_PASSWORD" "host" $redis.cache.host "port" $redis.cache.port) | quote }}
{{- include "agent-ic.secretKeysEnv" (dict "secret" $secrets.s3) }}
{{- include "agent-ic.secretKeysEnv" (dict "secret" $secrets.auth) }}
{{- if $secrets.email.enabled }}
{{- include "agent-ic.secretKeysEnv" (dict "secret" $secrets.email "optional" true) }}
{{- end }}
{{- if $secrets.llm.enabled }}
{{- include "agent-ic.secretKeysEnv" (dict "secret" $secrets.llm "optional" true) }}
{{- end }}
{{- if ne $langfuse.mode "off" }}
- name: LANGFUSE_HOST
  value: {{ $langfuse.host | quote }}
{{- include "agent-ic.secretKeysEnv" (dict "secret" $secrets.langfuse) }}
{{- end }}
{{- range $name, $value := $workload.env }}
- name: {{ $name }}
  value: {{ $value | quote }}
{{- end }}
{{- with $values.extraEnv }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{- define "agent-ic.probe" -}}
httpGet:
  path: {{ .path }}
  port: http
periodSeconds: {{ .timing.periodSeconds }}
timeoutSeconds: {{ .timing.timeoutSeconds }}
failureThreshold: {{ .timing.failureThreshold }}
{{- end -}}

{{- define "agent-ic.validate" -}}
{{- $admin := .Values.ingress.admin -}}
{{- $metricsPath := .Values.metrics.path -}}
{{- range $entryPoint := .Values.ingress.public.entryPoints -}}
{{- if has $entryPoint $admin.entryPoints -}}
{{- fail (printf "entry point %q is both public and admin" $entryPoint) -}}
{{- end -}}
{{- end -}}
{{- range $route := .Values.ingress.public.routes -}}
{{- $excludesAdmin := false -}}
{{- range $excludedPrefix := $route.excludePathPrefixes -}}
{{- if hasPrefix $excludedPrefix $admin.pathPrefix -}}
{{- $excludesAdmin = true -}}
{{- end -}}
{{- end -}}
{{- if and (eq $route.service $admin.service) (not $excludesAdmin) -}}
{{- fail (printf "public route %q targets the service %q without excluding the admin path %q" $route.name $admin.service $admin.pathPrefix) -}}
{{- end -}}
{{- if not (has $.Values.ingress.public.stripMiddleware $route.middlewares) -}}
{{- fail (printf "public route %q does not use the middleware %q that strips the admin header" $route.name $.Values.ingress.public.stripMiddleware) -}}
{{- end -}}
{{- range $middleware := $route.middlewares -}}
{{- if ne $middleware $.Values.ingress.public.stripMiddleware -}}
{{- fail (printf "public route %q uses the unknown middleware %q" $route.name $middleware) -}}
{{- end -}}
{{- end -}}
{{- if and (hasKey $.Values.workloads $route.service) (not $route.pathPrefixes) -}}
{{- fail (printf "public route %q is a host-only catch-all to the backend service %q" $route.name $route.service) -}}
{{- end -}}
{{- range $prefix := $route.pathPrefixes -}}
{{- if and (or (hasPrefix $prefix $admin.pathPrefix) (hasPrefix $admin.pathPrefix $prefix)) (not $excludesAdmin) -}}
{{- fail (printf "public route %q exposes the admin path %q" $route.name $admin.pathPrefix) -}}
{{- end -}}
{{- if or (hasPrefix $prefix $metricsPath) (hasPrefix $metricsPath $prefix) -}}
{{- fail (printf "public route %q exposes the metrics path %q" $route.name $metricsPath) -}}
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "agent-ic.routeRule" -}}
{{- $parts := list (printf "Host(`%s`)" .host) -}}
{{- if .pathPrefixes -}}
{{- $prefixes := list -}}
{{- range $prefix := .pathPrefixes -}}
{{- $prefixes = append $prefixes (printf "PathPrefix(`%s`)" $prefix) -}}
{{- end -}}
{{- $parts = append $parts (printf "(%s)" (join " || " $prefixes)) -}}
{{- end -}}
{{- range $excluded := .excludePathPrefixes -}}
{{- $parts = append $parts (printf "!PathPrefix(`%s`)" $excluded) -}}
{{- end -}}
{{- join " && " $parts -}}
{{- end -}}
