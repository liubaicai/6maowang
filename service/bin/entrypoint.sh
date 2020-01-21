#!/usr/bin/env bash

echo "Run migrations"
bundle exec rake db:migrate RAILS_ENV=production

echo "Seed database"
bundle exec rake db:seed RAILS_ENV=production

echo "Starting app server ..."
bundle exec puma -e production
