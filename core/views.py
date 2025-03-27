from django.http import JsonResponse
from django.shortcuts import render  # Импортируем render

def index(request):
    return render(request, 'index.html')  # Теперь шаблон будет работать

def get_message(request):
    return JsonResponse({"message": "Привет, мир!"})

def continents_api (request):
    continents = {
        "Africa": {
            "population": "1.4 billion",
            "area": "30.37 million km²",
            "description": "Africa is the second largest continent."
        },
        "Asia": {
            "population": "4.7 billion",
            "area": "44.58 million km²",
            "description": "Asia is the largest continent."
        },
        # Добавь другие континенты...
    }
    
    return JsonResponse(continents)