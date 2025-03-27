from django.urls import path
from .views import index, get_message, continents_api  # Добавляем continents_api

urlpatterns = [
    path('', index, name='index'),
    path('api/message/', get_message, name='get_message'),  # Пример API
    path('api/continents/', continents_api, name='continents_api'),  # Добавляем API континентов
]
