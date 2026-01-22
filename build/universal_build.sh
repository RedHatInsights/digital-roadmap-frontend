#!/bin/bash
set -euo pipefail

set -exv

export OUTPUT_DIR=${OUTPUT_DIR:-dist}

# ────────── SENTRY & SECRETS SETUP ──────────
# Source secrets if the parse-secrets script exists
if [[ -f ./build/parse-secrets.sh ]]; then
  source ./build/parse-secrets.sh
fi

# Get the app name in uppercase format for secret lookup
# Note: Uses PACKAGE_JSON_PATH env var (defaults to package.json)
APP_NAME_FOR_SECRET="$(jq -r '.insights.appname' < "${PACKAGE_JSON_PATH:-package.json}" | tr '[:lower:]-' '[:upper:]_')"
SECRET_VAR_NAME="${APP_NAME_FOR_SECRET}_SECRET"

if [[ -n "${!SECRET_VAR_NAME:-}" ]]; then
  export ENABLE_SENTRY=true
  export SENTRY_AUTH_TOKEN="${!SECRET_VAR_NAME}"
  echo "Sentry: token found for ${APP_NAME_FOR_SECRET} – enabling sourcemap upload."
else
  echo "Sentry: no token for ${APP_NAME_FOR_SECRET} – using any pre-set token (if provided) or skipping upload."
fi

# Configure git to trust this directory
git config --global --add safe.directory /opt/app-root/src

# ────────── END SENTRY & SECRETS SETUP ──────────

export APP_BUILD_DIR=${APP_BUILD_DIR:-dist}

function install() {
  if [ $USES_NPM == true ]; then
    npm ci
  elif [ $USES_YARN == true ]; then
    yarn install --immutable
  else
    # Normally we would not use exit in a source'd file, but this should fail the job
    echo "Exiting; no supported installation packages"
    exit 1
  fi
}

function verify() {
  if [ $USES_NPM == true ]; then
    npm run verify
  elif [ $USES_YARN == true ]; then
    yarn verify
  else
    # Normally we would not use exit in a source'd file, but this should fail the job
    echo "Exiting; no supported verification tool or target"
    exit 1
  fi
}

function build() {
  if [[ "$USES_NPM" == true ]]; then
    # If NPM_BUILD_SCRIPT env var is set use that
    # Otherwise just build
    if [[ -n "$NPM_BUILD_SCRIPT" ]]; then
      npm run "$NPM_BUILD_SCRIPT"
    else
      npm run build
    fi
  elif [[ "$USES_YARN" == true ]]; then
    # If YARN_BUILD_SCRIPT env var is set use that
    # Otherwise just build
    if [[ -n "$YARN_BUILD_SCRIPT" ]]; then
      yarn "$YARN_BUILD_SCRIPT"
    else
      yarn build:prod
    fi
  else
    # Normally we would not use exit in a source'd file, but this should fail the job
    echo "Exiting; no supported build or target"
    exit 1
  fi
}

function delete_node_modules() {
  if [[ -d "node_modules" ]]; then
    rm -rf node_modules
  else
    echo "node_modules directory not found."
  fi
}

function setNpmOrYarn() {
  # We can't assume npm or yarn, so we turn on the toggle depending on files in the root
  if [[ -f package-lock.json ]]; then
    USES_NPM=true
  elif [[ -f yarn.lock ]]; then
    USES_YARN=true
  else
  # Normally we would not use exit in a source'd file, but this should fail the job
    echo "Exiting; no yarn or npm package lock files found. Add a package-lock.json or yarn.lock to your project root"
    exit 1
  fi
}

get_appname_from_package() {
  jq --raw-output '.insights.appname' < $PACKAGE_JSON_PATH
}

# Work around large package timeout; up default from 30s to 5m
yarn config set network-timeout 300000

if ! APP_NAME=$(get_appname_from_package); then
  echo "could not read application name from package.json"
  exit 1
fi

export APP_NAME

setNpmOrYarn

install

export BETA=false
build
build_app_info.sh > "${APP_BUILD_DIR}/app.info.json"
server_config_gen.sh
