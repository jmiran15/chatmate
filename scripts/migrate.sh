#!/bin/bash

fallocate -l 2G /swapfile
chmod 0600 /swapfile
mkswap /swapfile
echo 10 >/proc/sys/vm/swappiness
swapon /swapfile
echo 1 >/proc/sys/vm/overcommit_memory

# Increase PostgreSQL's work_mem and maintenance_work_mem
psql $DATABASE_URL -c "ALTER SYSTEM SET work_mem = '256MB';"
psql $DATABASE_URL -c "ALTER SYSTEM SET maintenance_work_mem = '1GB';"
psql $DATABASE_URL -c "SELECT pg_reload_conf();"

# Run the migration with an increased statement timeout
psql $DATABASE_URL -c "SET statement_timeout = '3h';"
npx prisma migrate deploy

# Reset the PostgreSQL settings
psql $DATABASE_URL -c "ALTER SYSTEM RESET work_mem;"
psql $DATABASE_URL -c "ALTER SYSTEM RESET maintenance_work_mem;"
psql $DATABASE_URL -c "SELECT pg_reload_conf();"
