source "https://ruby.taobao.org"

gem 'rack'
gem 'sinatra'
gem 'haml'
gem 'json'

gem 'oj'

gem 'activerecord', :require => 'active_record'
gem 'dalli', :require => 'active_support/cache/dalli_store'
gem 'kgio'
gem "second_level_cache"
gem 'pg'

gem 'rake'
# gem 'pony'   # pony must be after activerecord

group :production do
  gem 'rainbows'
end

group :development do
  gem 'thin'
  gem 'pry'
  gem 'sinatra-contrib'
end

group :test do
  gem 'minitest', :require => "minitest/autorun"
  gem 'rack-test', :require => "rack/test"
  gem 'factory_girl'
  gem 'database_cleaner'
end
