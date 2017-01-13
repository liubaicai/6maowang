json.extract! photo, :id, :title, :url, :description, :exif, :created_at, :updated_at
json.url photo_url(photo, format: :json)