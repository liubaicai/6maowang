json.extract! gallery, :id, :title, :cover, :description, :created_at, :updated_at
json.url gallery_url(gallery, format: :json)