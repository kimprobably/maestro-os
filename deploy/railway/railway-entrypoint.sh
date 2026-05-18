#!/bin/sh
set -eu

FABRO_HOME="${FABRO_HOME:-/storage/.home}"
mkdir -p "$FABRO_HOME" /storage

# Ensure /storage and FABRO_HOME themselves are owned by fabro.
chown fabro:fabro /storage "$FABRO_HOME"

# One-time storage ownership migration.
#
# Earlier versions of this image ran the Fabro server as root, so the
# Railway volume can hold root-owned files under /storage from prior
# deployments (run state, server.env, sessions, runs/*, etc.). Without
# this migration, the non-root server cannot write to those files and
# silently fails — sometimes only on a slow path days into a deploy.
#
# We scope the migration with -xdev to stay inside the volume, and use
# `! -user fabro` so the find only matches root-owned (or other-owned)
# entries. On a freshly provisioned volume this returns nothing and the
# command is a no-op; on an upgraded volume it chowns every legacy file
# exactly once, after which subsequent boots are also no-ops.
#
# Note: on very large volumes this scan can take a while on first boot
# after upgrade. The cost is paid once per volume. Document this in the
# Railway runbook so operators aren't surprised by a slower-than-usual
# first boot after the cutover.
find /storage -xdev ! -user fabro -exec chown fabro:fabro {} +

exec gosu fabro "$@"
