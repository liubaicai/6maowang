
max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

environment "production"

cwd = File.dirname(__FILE__) + '/../..'
directory cwd

rackup "#{cwd}/config.ru"

pidfile "#{cwd}/tmp/pids/server.pid"

workers ENV.fetch("WEB_CONCURRENCY") { 1 }

# preload_app!

bind "tcp://0.0.0.0:#{ENV.fetch('PORT') { 3000 }}"

plugin :tmp_restart
