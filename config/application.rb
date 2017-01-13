require File.expand_path('../boot', __FILE__)

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "sprockets/railtie"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Maowang
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # Do not swallow errors in after_commit/after_rollback callbacks.
    config.active_record.raise_in_transactional_callbacks = true
  end
end

$APP_CONFIG_FILE_PATH = 'config/app_config.yml'
$APP_CONFIG = YAML.load_file($APP_CONFIG_FILE_PATH)

class Settings
  def self.get(mod,key)
    $APP_CONFIG[mod][key]
  end
  def self.set(mod,key,value,autosave=true)
    $APP_CONFIG[mod][key] = value
    if autosave
      save_config
    end
  end
  def self.save_config
    result = true
    begin
      File.open($APP_CONFIG_FILE_PATH, 'w') { |f|
        f.puts $APP_CONFIG.ya2yaml
      }
    rescue => err
      logger = Logger.new('log/config_err.log')
      logger.error err
      result = false
    end
    result
  end
end

require 'aliyun/oss'
$OSS_Client = Aliyun::OSS::Client.new(
    :endpoint => Settings.get('aliyun','endpoint'),
    :access_key_id => Settings.get('aliyun','access_key_id'),
    :access_key_secret => Settings.get('aliyun','access_key_secret'))

$CACHE_CACHE = ActiveSupport::Cache::MemoryStore.new
