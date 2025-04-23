#!/bin/bash

# ----------------------------------------------------------------------------
# Script Name: build_app_info.sh
# Description: outputs to STDOUT a JSON containing various
#              pieces of information about a Node.js application and its
#              dependencies. The generated JSON includes the application
#              name, Node.js version, source hash, source tag, source branch,
#              PatternFly dependencies, and Red Hat Cloud Services
#              dependencies, gleaned from the git environment and package.json.
#
# Usage:       ./build_app_info.sh
#
# Parameters:  None
#
# Dependencies: The script requires `jq` and `node` to be installed, and expects
#               to be run in a git repository directory to extract certain
#               pieces of source information.
# ----------------------------------------------------------------------------

get_package_value() {
  local key="$1"

  jq ".${key} // \"unknown\" " --raw-output < package.json
}

# handle_npm_list
# Purpose: Retrieve a comma-separated list of dependency versions for a given scope.
# Parameters:
#   - dependency_scope: A string to grep for in the npm list, e.g. a scope or package name.
# Usage: handle_npm_list <dependency_scope>
# Example: handle_npm_list "@patternfly"
handle_npm_list() {
  local dependency_scope="$1"

  # Check if a lock file exists, suggesting that the node_modules directory is present.
  if [[ -f package-lock.json ]] || [[ -f yarn.lock ]]; then
    # Retrieve and format the dependency list. If unsuccessful, return an empty string.
    local dep_list
    dep_list=$(npm list --silent --depth=0 --production | grep "$dependency_scope" -i | sed -E "s/^(.{0})(.{4})/\1/" | tr "\n" "," | sed -E "s/,/\",\"/g" || echo "")

    # Check if the dependency list is empty and log an error message if so.
    if [[ -z "$dep_list" ]]; then
      echo "Error: No dependencies matching '$dependency_scope' found." >&2
      echo "" # Return an empty string as the function result.
    else
      echo "$dep_list"
    fi
  else
    # If no lock file is present, log an error message and return an empty string.
    echo "Error: No package-lock.json or yarn.lock file found. Cannot retrieve dependency list for '$dependency_scope'." >&2
    echo ""
  fi
}

get_git_branch() {
  # Retrieve the current Git branch name or return "unknown" if unsuccessful.
  if ! git branch --show-current 2>/dev/null; then
    echo "unknown"
  fi
}

get_git_tag() {
  # Retrieve the current Git tag or return "unknown" if unsuccessful.
  if ! git describe --tags --abbrev=0 2>/dev/null; then
    echo "unknown"
  fi
}

get_git_hash() {
  if ! git rev-parse --verify HEAD 2>/dev/null; then
    echo "unknown"
  fi
}

SRC_HASH=$(get_git_hash)
APP_NAME=$(get_package_value "insights.appname")
NODE_VERSION=$(get_package_value "engines.node")
SRC_BRANCH=$(get_git_branch)
SRC_TAG=$(get_git_tag)

PATTERNFLY_DEPS=$(handle_npm_list "@patternfly")
RH_CLOUD_SERVICES_DEPS=$(handle_npm_list "@redhat-cloud-services")
PATTERNFLY_DEPS="[\"${PATTERNFLY_DEPS%???}\"]"
RH_CLOUD_SERVICES_DEPS="[\"${RH_CLOUD_SERVICES_DEPS%???}\"]"

# JSON generation with `jq`
jq -n \
  --arg an "$APP_NAME" \
  --arg nv "$NODE_VERSION" \
  --arg sh "$SRC_HASH" \
  --arg st "$SRC_TAG" \
  --arg sb "$SRC_BRANCH" \
  --arg pd "$PATTERNFLY_DEPS" \
  --arg rh "$RH_CLOUD_SERVICES_DEPS" \
  '{
    app_name: $an,
    node_version: $nv,
    src_hash: $sh,
    src_tag: $st,
    src_branch: $sb,
    patternfly_dependencies: $pd,
    rh_cloud_services_dependencies: $rh
  }'
