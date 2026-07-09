# syntax=docker/dockerfile:1

# Production image for the Leanbox Laravel API.
#
# Built on serversideup/php (php-fpm + nginx, runs non-root as www-data on :8080).
# ONE image serves three Render services — the web app, the queue worker, and the
# scheduler — with the start command overridden per service in render.yaml.
FROM serversideup/php:8.2-fpm-nginx

# --- PHP extensions ----------------------------------------------------------
# pdo_pgsql for Supabase Postgres. The base image already bundles the common set.
USER root
RUN install-php-extensions pdo_pgsql

# Don't migrate on container boot — migrations run once in Render's pre-deploy
# step so the web / worker / cron containers don't race each other.
ENV AUTORUN_ENABLED=false \
    PHP_OPCACHE_ENABLE=1

# --- application -------------------------------------------------------------
USER www-data
WORKDIR /var/www/html

# Install PHP deps first for better layer caching (no scripts until app is present).
COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist \
        --no-scripts --optimize-autoloader

# Copy the rest of the app, then finish autoload + package discovery.
COPY --chown=www-data:www-data . .
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist \
        --optimize-autoloader

# serversideup base image provides the entrypoint (php-fpm + nginx on :8080).
# render.yaml sets PORT=8080 on the web service so Render routes traffic there.
