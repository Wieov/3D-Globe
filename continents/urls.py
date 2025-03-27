from django.urls import path
from .views import continents_api  # Убеждаемся, что импортируем правильно

urlpatterns = [
    path('api/continents/', continents_api, name='continents_api'),
]
