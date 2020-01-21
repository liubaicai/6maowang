Rails.application.routes.draw do
  
  root 'home#index'
  
  post 'user/login'
  post 'photos/upload'
  get 'settings/backup'
  post 'settings/backup', to: 'settings#restore'
  
  resources :photos
  resources :galleries
  resources :settings
  
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
end
