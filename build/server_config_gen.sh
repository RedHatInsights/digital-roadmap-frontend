#!/bin/bash

export LC_ALL=en_US.utf-8
export LANG=en_US.utf-8
export GIT_COMMIT=$(git rev-parse HEAD)

NPM_INFO="undefined"
PATTERNFLY_DEPS="undefined"
export USES_CADDY=true
SERVER_NAME=${SERVER_NAME:-$APP_NAME}

generate_caddy_config() {

  local ROUTE_PATH=${ROUTE_PATH:-"/apps/${APP_NAME}"}

  echo "{
	{\$CADDY_TLS_MODE}
	auto_https disable_redirects
	servers {
		metrics
	}
}

:9000 {
	metrics /metrics
}

:8000 {
	{\$CADDY_TLS_CERT}
	log

	# Handle main app route
	@app_match {
		path ${ROUTE_PATH}*
	}
	handle @app_match {
		uri strip_prefix ${ROUTE_PATH}
		file_server * {
			root /srv/${OUTPUT_DIR}
			browse
		}
	}

  # Handle env based main route
  @env_match {
      path {\$ENV_PUBLIC_PATH}*
  }

  handle @env_match {
      uri strip_prefix {\$ENV_PUBLIC_PATH}
      file_server * {
          root /srv/${OUTPUT_DIR}
          browse
      }
  }

	handle / {
		redir /apps/chrome/index.html permanent
	}
}"
}

generate_docker_ignore() {
  cat << EOF
node_modules
.git
EOF
}

# FIXME: How's this any different from the "build_app_info.sh script??"
generate_app_info() {
  if [[ -f package-lock.json ]] || [[ -f yarn.lock ]]; then
    LINES=$(npm list --silent --depth=0 --production | grep @patternfly -i | sed -E "s/^(.{0})(.{4})/\1/" | tr "\n" "," | sed -E "s/,/\",\"/g")
    PATTERNFLY_DEPS="[\"${LINES%???}\"]"
    LINES=$(npm list --silent --depth=0 --production | grep @redhat-cloud-services -i | sed -E "s/^(.{0})(.{4})/\1/" | tr "\n" "," | sed -E "s/,/\",\"/g")
    RH_CLOUD_SERVICES_DEPS="[\"${LINES%???}\"]"
  else
    PATTERNFLY_DEPS="[]"
    RH_CLOUD_SERVICES_DEPS="[]"
  fi

  echo -n "{
  \"app_name\": \"$APP_NAME\",
  \"src_hash\": \"$GIT_COMMIT\",
  \"patternfly_dependencies\": $PATTERNFLY_DEPS,
  \"rh_cloud_services_dependencies\": $RH_CLOUD_SERVICES_DEPS
  }"
}

# Now we check for a Caddyfile and if it's correct to generate
if [[ -f Caddyfile ]]; then
    echo "Caddy config already exists, skipping generation"
else
    generate_caddy_config > Caddyfile;
fi

if [[ -f .dockerignore ]]; then
  echo "Docker ignore already exists, skipping generation"
else
  generate_docker_ignore > .dockerignore
fi


if [[ -n "${APP_BUILD_DIR:-}" &&  -d $APP_BUILD_DIR ]]; then
  OUTPUT_DIR="$APP_BUILD_DIR"
fi

if [[ -f "${OUTPUT_DIR}/app.info.deps.json" ]]; then
  echo "app.info.deps.json already exists, skipping generation"
else
  echo $NPM_INFO > "${OUTPUT_DIR}/app.info.deps.json"
fi

if [[ -f "${OUTPUT_DIR}/app.info.json" ]]; then
  echo "app.info.json already exists, skipping generation"
else
  generate_app_info > "${OUTPUT_DIR}/app.info.json"
fi
