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
expect_failure "unknown role" \
  'role' \
  --set workloads.api.role=other
expect_failure "unknown environment" \
  'nodeEnv' \
  --set config.nodeEnv=staging
expect_failure "enabled optional secret without a name" \
  'missing propert' \
  --set secrets.llm.enabled=true
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
