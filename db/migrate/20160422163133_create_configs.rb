class CreateConfigs < ActiveRecord::Migration
 def self.up
   create_table :configs do |t|
     t.string :ckey
     t.string :cvalue
     t.timestamps
   end
 end

 def self.down
   drop_table :configs
 end
end
