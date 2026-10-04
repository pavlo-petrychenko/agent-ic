#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

chart=deploy/helm/agent-ic
test_values=tools/chart/test-values.yaml
release=agent-ic
namespace=agent-ic
crd_catalog_ref="${CRD_CATALOG_REF:?CRD_CATALOG_REF is required}"
crd_catalog="https://raw.githubusercontent.com/datreeio/CRDs-catalog/${crd_catalog_ref}/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json"
kubernetes_version="${KUBERNETES_VERSION:?KUBERNETES_VERSION is required}"
kubeconform_cache="${KUBECONFORM_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/kubeconform}"

mkdir -p "$kubeconform_cache"

rendered="$(mktemp -d)"
trap 'rm -rf "$rendered"' EXIT

render() {
  local name="$1"
  shift
  helm template "$release" "$chart" --namespace "$namespace" --values "$test_values" "$@" >"$rendered/$name.yaml"
}

echo "== helm lint"
helm lint "$chart" --values "$test_values"

echo "== chart defaults require the environment values"
if helm template "$release" "$chart" --namespace "$namespace" >/dev/null 2>&1; then
  echo "chart rendered without the required environment values" >&2
  exit 1
fi

echo "== render"
render default
render optional-secrets \
  --set secrets.email.enabled=true \
  --set secrets.email.name=app-email \
  --set secrets.email.keys.RESEND_API_KEY=apiKey \
  --set secrets.llm.enabled=true \
  --set secrets.llm.name=app-llm \
  --set secrets.llm.keys.LLM_API_KEY=apiKey
render resend-email \
  --set config.email.mode=resend \
  --set secrets.email.enabled=true \
  --set secrets.email.name=app-email \
  --set secrets.email.keys.RESEND_API_KEY=apiKey
render langfuse \
  --set config.langfuse.mode=self-hosted \
  --set config.langfuse.host=http://langfuse-web.langfuse.svc.example.test:3000
render minimal \
  --set keda.enabled=false \
  --set config.telemetry.enabled=false \
  --set migration.enabled=false \
  --set serviceMonitor.enabled=false \
  --set dashboards.enabled=false \
  --set prometheusRule.enabled=false
render admin-prefix-with-trailing-slash \
  --set ingress.admin.pathPrefix=/api/admin/queues/

echo "== no unresolved template values"
if grep -n '<no value>' "$rendered"/*.yaml; then
  echo "unresolved template values" >&2
  exit 1
fi

echo "== no comments in chart sources"
if grep -rnE '^[[:space:]]*(#|\{\{-?[[:space:]]*/\*)' "$chart" --include='*.yaml' --include='*.tpl' --include='*.json'; then
  echo "comment lines found" >&2
  exit 1
fi

echo "== images are tagged"
images="$(grep -hE '^[[:space:]]*image: ' "$rendered/default.yaml" | sed -E 's/^[[:space:]]*image: //; s/"//g' | sort -u)"
echo "$images"
if grep -E ':latest$' <<<"$images" || grep -vE ':[A-Za-z0-9_][A-Za-z0-9_.+-]*$' <<<"$images"; then
  echo "untagged or latest images" >&2
  exit 1
fi

echo "== container arguments use the serve and migrate subcommands"
api_args="$(yq -N 'select(.kind == "Deployment" and .metadata.name == "agent-ic-api") | .spec.template.spec.containers[0].args | join(" ")' "$rendered/default.yaml")"
worker_args="$(yq -N 'select(.kind == "Deployment" and .metadata.name == "agent-ic-worker-ingest") | .spec.template.spec.containers[0].args | join(" ")' "$rendered/default.yaml")"
migrate_args="$(yq -N 'select(.kind == "Job") | .spec.template.spec.containers[0].args | join(" ")' "$rendered/default.yaml")"
migrate_command="$(yq -N 'select(.kind == "Job") | .spec.template.spec.containers[0].command // "none"' "$rendered/default.yaml")"
test "$api_args" = "serve --role=api"
test "$worker_args" = "serve --role=worker --queues=ingest"
test "$migrate_args" = "migrate"
test "$migrate_command" = "none"
echo "$api_args | $worker_args | $migrate_args"

echo "== optional secrets are marked optional and absent when disabled"
if grep -qE 'RESEND_API_KEY|LLM_API_KEY' "$rendered/default.yaml"; then
  echo "optional secret referenced while disabled" >&2
  exit 1
fi
optional_refs="$(yq -N 'select(.kind == "Deployment" and .metadata.name == "agent-ic-api") | .spec.template.spec.containers[0].env[] | select(.name == "RESEND_API_KEY" or .name == "LLM_API_KEY") | .valueFrom.secretKeyRef.optional' "$rendered/optional-secrets.yaml" | sort -u)"
test "$optional_refs" = "true"

echo "== the e-mail mode reaches every backend workload"
email_modes="$(yq -N 'select(.kind == "Deployment" and .metadata.name != "agent-ic-web") | .spec.template.spec.containers[0].env[] | select(.name == "EMAIL_MODE") | .value' "$rendered/default.yaml" | sort -u)"
test "$email_modes" = "smtp"
resend_mode="$(yq -N 'select(.kind == "Deployment" and .metadata.name == "agent-ic-worker-runs") | .spec.template.spec.containers[0].env[] | select(.name == "EMAIL_MODE") | .value' "$rendered/resend-email.yaml")"
test "$resend_mode" = "resend"
echo "$email_modes | $resend_mode"

echo "== the admin header is added on the admin route and stripped on every public route"
header_name="$(yq -r '.ingress.admin.requestHeader.name' "$chart/values.yaml")"
backend_header="$(sed -nE "s/^[[:space:]]*PlatformAdminRoute = '([^']+)',?$/\\1/p" apps/backend/src/platform/http/constants/http-header.constants.ts)"
test "$header_name" = "$backend_header"
local_header="$(yq -r '.http.middlewares."admin-header".headers.customRequestHeaders | keys | .[0]' deploy/docker/traefik/dynamic.yaml)"
test "$header_name" = "$local_header"
admin_value="$(HEADER="$header_name" yq -N 'select(.kind == "Middleware" and .metadata.name == "agent-ic-admin-header") | .spec.headers.customRequestHeaders[strenv(HEADER)]' "$rendered/default.yaml")"
strip_removes_header="$(HEADER="$header_name" yq -N 'select(.kind == "Middleware" and .metadata.name == "agent-ic-public-strip-admin-header") | .spec.headers.customRequestHeaders[strenv(HEADER)] == ""' "$rendered/default.yaml")"
test -n "$admin_value" && test "$admin_value" != "null"
test "$strip_removes_header" = "true"
admin_middlewares="$(yq -N 'select(.kind == "IngressRoute" and .metadata.name == "agent-ic-admin") | .spec.routes[0].middlewares[].name' "$rendered/default.yaml" | paste -sd, -)"
test "$admin_middlewares" = "agent-ic-admin-root,agent-ic-admin-header"
unstripped="$(yq -N 'select(.kind == "IngressRoute" and .metadata.name == "agent-ic-public") | .spec.routes[] | select(([.middlewares[].name] | contains(["agent-ic-public-strip-admin-header"])) | not) | .match' "$rendered/default.yaml")"
test -z "$unstripped"
echo "$header_name | $admin_middlewares"

echo "== the api pods accept traffic only from the Traefik, own and Prometheus namespaces"
policy_peers="$(yq -N 'select(.kind == "NetworkPolicy" and .metadata.name == "agent-ic-api") | .spec.ingress[0].from[] | (.namespaceSelector.matchLabels."kubernetes.io/metadata.name" // "own")' "$rendered/default.yaml" | paste -sd, -)"
test "$policy_peers" = "traefik,own,observability"
policy_count="$(yq -N 'select(.kind == "NetworkPolicy") | .metadata.name' "$rendered/default.yaml" | wc -l | tr -d ' ')"
test "$policy_count" = "1"
echo "$policy_peers"

echo "== guardrails reject unsafe values"
expect_failure() {
  local name="$1" pattern="$2" output
  shift 2
  if output="$(helm template "$release" "$chart" --namespace "$namespace" --values "$test_values" "$@" 2>&1)"; then
    echo "chart accepted: $name" >&2
    exit 1
  fi
  if ! grep -qE "$pattern" <<<"$output"; then
    echo "chart rejected: $name, but not for the expected reason ($pattern):" >&2
    echo "$output" >&2
    exit 1
  fi
  echo "rejected: $name"
}
routes_with() {
  yq -o=json -I=0 "$1 | .ingress.public.routes" "$chart/values.yaml"
}
expect_failure "admin path on a public route" \
  'without excluding the admin path' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[0].excludePathPrefixes = []')"
expect_failure "api route without the admin exclusion on a narrow prefix" \
  'without excluding the admin path' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[0].pathPrefixes = ["/api/graphql"] | .ingress.public.routes[0].excludePathPrefixes = []')"
expect_failure "host-only catch-all to api" \
  'without excluding the admin path' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[0].pathPrefixes = [] | .ingress.public.routes[0].excludePathPrefixes = []')"
expect_failure "host-only catch-all to api that excludes the admin path" \
  'host-only catch-all' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[0].pathPrefixes = []')"
expect_failure "host-only catch-all to the gateway" \
  'host-only catch-all' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[1].pathPrefixes = []')"
expect_failure "public prefix inside the admin path with a trailing slash" \
  'exposes the admin path' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[1].pathPrefixes = ["/api/admin/queues/"]')"
expect_failure "admin path exclusion that stops at the trailing slash" \
  'without excluding the admin path' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[0].excludePathPrefixes = ["/api/admin/queues/"]')"
expect_failure "public route covering metrics" \
  'exposes the metrics path' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[2].pathPrefixes = ["/"] | .ingress.public.routes[2].excludePathPrefixes = ["/api/admin/queues"]')"
expect_failure "admin entry point on the public route" \
  'is both public and admin' \
  --set 'ingress.public.entryPoints[0]=admin'
expect_failure "public route without the strip middleware" \
  'does not use the middleware "strip-admin-header"' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[2].middlewares = []')"
expect_failure "public route with the strip middleware removed from the gateway route" \
  'does not use the middleware "strip-admin-header"' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[1].middlewares = []')"
expect_failure "public route with an unknown middleware" \
  'unknown middleware' \
  --set-json "ingress.public.routes=$(routes_with '.ingress.public.routes[0].middlewares += ["other"]')"
expect_failure "admin header without a value" \
  'requestHeader' \
  --set ingress.admin.requestHeader.value=
expect_failure "network policy without the Traefik namespace" \
  'traefikNamespace' \
  --set networkPolicy.traefikNamespace=
expect_failure "network policy without the Prometheus namespace" \
  'prometheusNamespace' \
  --set networkPolicy.prometheusNamespace=
expect_failure "unknown role" \
  'role' \
  --set workloads.api.role=other
expect_failure "unknown environment" \
  'nodeEnv' \
  --set config.nodeEnv=staging
expect_failure "enabled optional secret without a name" \
  'missing propert' \
  --set secrets.llm.enabled=true
expect_failure "resend e-mail without the e-mail secret" \
  'needs secrets.email.enabled' \
  --set config.email.mode=resend
expect_failure "unknown e-mail mode" \
  'mode' \
  --set config.email.mode=sendmail
expect_failure "migration without arguments" \
  'migration' \
  --set-json 'migration.args=[]'

echo "== kubeconform"
kubeconform \
  -strict \
  -summary \
  -cache "$kubeconform_cache" \
  -skip CustomResourceDefinition \
  -kubernetes-version "$kubernetes_version" \
  -schema-location default \
  -schema-location "$crd_catalog" \
  "$rendered"/*.yaml
