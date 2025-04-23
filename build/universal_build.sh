#!/bin/bash

set -exv

export OUTPUT_DIR=${OUTPUT_DIR:-dist}

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
  jq --raw-output '.insights.appname' < package.json
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
build_app_info.sh > "${OUTPUT_DIR}/app.info.json"
server_config_gen.sh
