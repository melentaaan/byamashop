#!/usr/bin/env bash
# Démarre un PostgreSQL 16 éphémère pour les tests SQL (port 54329).
# Usage : scripts/db-test-server.sh start|stop
set -euo pipefail
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DATA="${PGTEST_DIR:-/tmp/byamashop-pgtest}"
PORT="${PGTEST_PORT:-54329}"
run() { if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }

case "${1:-start}" in
  start)
    if [ ! -d "$DATA" ]; then
      mkdir -p "$DATA"; [ "$(id -u)" = "0" ] && chown postgres "$DATA"
      run "$PGBIN/initdb -D $DATA -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null"
    fi
    run "$PGBIN/pg_ctl -D $DATA -o '-p $PORT -k /tmp -c listen_addresses=127.0.0.1' -l $DATA/log.txt -w start >/dev/null"
    echo "PostgreSQL de test démarré sur 127.0.0.1:$PORT"
    ;;
  stop)
    run "$PGBIN/pg_ctl -D $DATA -m fast stop >/dev/null" || true
    ;;
esac
