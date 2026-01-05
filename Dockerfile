FROM registry.access.redhat.com/ubi9/nodejs-22:9.7-1765878606 as builder

USER root

RUN dnf install jq -y

USER default

RUN npm i -g yarn

COPY build/*.sh /opt/app-root/bin/
COPY --chown=default . .

RUN universal_build.sh

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

COPY --from=builder /opt/app-root/src/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /opt/app-root/src/dist dist
COPY package.json .

RUN useradd --key HOME_MODE=0775 --system --gid 0 caddy

USER caddy
