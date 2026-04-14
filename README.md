# AI Smart Kanban (Vanilla JS)

System zarządzania zadaniami w architekturze MVC, zbudowany w czystym JavaScript, integrujący modele sztucznej inteligencji do automatycznego dekomponowania celów biznesowych.

## Technologie i Koncepty
* **Vanilla JavaScript**: Logika aplikacji oparta na klasach (OOP).
* **Architektura MVC**: Ścisła separacja logiki danych, interfejsu i logiki biznesowej.
* **Drag & Drop API**: Obsługa przeciągania elementów DOM.
* **Web Storage API (localStorage)**: Lokalne zapisywanie danych.
* **Google Gemini API**: AI asystująca w planowaniu workflow.

## Funkcja "AI Breakdown"
Zamiast ręcznie wpisywać pojedyncze zadania, użytkownik podaje cel główny (np. "System logowania"). Kontroler wysyła zapytanie do modelu LLM, który analizuje problem i automatycznie generuje techniczne sub-taski prosto na tablicę "Do zrobienia".