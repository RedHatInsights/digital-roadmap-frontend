FROM registry.access.redhat.com/ubi9/nodejs-22:9.7-1765878606 as builder

USER root

RUN dnf install jq -y

USER default

RUN npm i -g yarn

ARG APP_BUILD_DIR=dist
ARG PACKAGE_JSON_PATH=package.json
ARG ENABLE_SENTRY=false
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE
ARG USES_YARN=false
ARG YARN_BUILD_SCRIPT=""
ARG NPM_BUILD_SCRIPT=""

ENV ENABLE_SENTRY=${ENABLE_SENTRY}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV USES_YARN=${USES_YARN}
ENV YARN_BUILD_SCRIPT=${YARN_BUILD_SCRIPT}

COPY build/*.sh /opt/app-root/bin/
COPY --chown=default . .

USER root
RUN --mount=type=secret,id=build-container-additional-secret/secrets,required=false \
  universal_build.sh
USER default

FROM quay.io/redhat-services-prod/hcm-eng-prod-tenant/caddy-ubi:latest

ARG SOURCE_DATE_EPOCH

LABEL cpe="cpe:2.3:a:redhat:insights_planning_frontend:-:*:*:*:*:*:*:*"
LABEL description="Web UI for Insights Planning"
LABEL io.k8s.description="Insights Planning API"
LABEL io.k8s.display-name="Insights Planning API"
LABEL io.openshift.tags="rhel,insights,roadmap"
LABEL name=insights-planning-frontend
LABEL org.opencontainers.image.created=${SOURCE_DATE_EPOCH}
LABEL url="https://github.com/RedHatInsights/digital-roadmap-frontend"
LABEL vendor="Red Hat, Inc."

COPY LICENSE /licenses/

ENV CADDY_TLS_MODE http_port 8000
ENV ENV_PUBLIC_PATH "/default"

ARG APP_BUILD_DIR=dist
ARG PACKAGE_JSON_PATH=package.json

# Copy the valpop binary from the valpop image
COPY --from=quay.io/redhat-services-prod/hcc-platex-services-tenant/valpop:latest /usr/local/bin/valpop /usr/local/bin/valpop

COPY --from=builder /opt/app-root/src/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /opt/app-root/src/dist dist
COPY ${PACKAGE_JSON_PATH} .

RUN useradd --key HOME_MODE=0775 --system --gid 0 caddy

USER caddy
