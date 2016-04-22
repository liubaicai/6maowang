class CreateSiteConfigs < ActiveRecord::Migration
 def self.up
   create_table :site_configs do |t|
     t.string :ckey
     t.string :cvalue
     t.timestamps
   end
 end

 def self.down
   drop_table :site_configs
 end
end
