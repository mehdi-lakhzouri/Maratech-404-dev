# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TILI RAG — Makefile (Windows-compatible)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PYTHON = .\.venv\Scripts\python.exe
PIP = .\.venv\Scripts\pip.exe
UVICORN = .\.venv\Scripts\uvicorn.exe

.PHONY: install ingest api web dev test-query clean help

help: ## Show this help
	@echo.
	@echo   TILI RAG - Commandes disponibles
	@echo   ================================
	@echo.
	@echo   make install       Installer toutes les dependances
	@echo   make ingest        Lancer le pipeline d'ingestion
	@echo   make api           Demarrer le serveur FastAPI (port 8000)
	@echo   make web           Demarrer le serveur React (port 3000)
	@echo   make dev           Demarrer API + Web en parallele
	@echo   make test-query    Test rapide de l'API
	@echo   make clean         Nettoyer les fichiers generes
	@echo.

install: ## Install all dependencies
	$(PIP) install -r RAG\requirements.txt
	$(PIP) install fastapi "uvicorn[standard]" sse-starlette
	cd web && npm install

ingest: ## Run RAG ingestion pipeline
	$(PYTHON) -m RAG.ingest --reset

api: ## Start FastAPI server on port 8000
	$(UVICORN) api.main:app --host 0.0.0.0 --port 8000 --reload

web: ## Start React dev server on port 3000
	cd web && npm run dev

dev: ## Start both API and Web in parallel
	@echo Starting API server...
	start "TILI-API" cmd /c "$(UVICORN) api.main:app --host 0.0.0.0 --port 8000 --reload"
	@echo Starting Web server...
	start "TILI-WEB" cmd /c "cd web && npm run dev"
	@echo.
	@echo   API: http://localhost:8000
	@echo   Web: http://localhost:3000
	@echo   Docs API: http://localhost:8000/docs
	@echo.

test-query: ## Quick smoke test
	@echo Testing /health ...
	@powershell -Command "Invoke-RestMethod -Uri 'http://localhost:8000/health' | ConvertTo-Json"
	@echo.
	@echo Testing /ask ...
	@powershell -Command "$$body = '{\"question\": \"Quel est le budget de TILI?\"}'; Invoke-RestMethod -Uri 'http://localhost:8000/ask' -Method POST -Body $$body -ContentType 'application/json' | ConvertTo-Json -Depth 3"

clean: ## Remove generated files
	@if exist RAG\chroma_db rmdir /s /q RAG\chroma_db
	@if exist web\node_modules rmdir /s /q web\node_modules
	@for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
	@echo Cleaned!
