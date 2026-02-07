# TILI RAG Platform - Quick Start Guide

## 1. Get an OpenRouter API Key

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Click **Sign Up** (or Sign In if you have an account)
3. Navigate to **Keys** in the dashboard
4. Click **Create Key**
5. Copy your key (starts with `sk-or-v1-...`)

> **Free tier**: OpenRouter offers free credits for some models like `openai/gpt-4o-mini`

---

## 2. Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Pull the images

```bash
docker pull fedihmida/hackathon:api
docker pull fedihmida/hackathon:web
```

### Create project folder

```bash
mkdir tili-rag && cd tili-rag
```

### Create `.env` file

```bash
echo "OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE" > .env
```

Replace `sk-or-v1-YOUR_KEY_HERE` with your actual API key.

### Create `docker-compose.yml`

```yaml
services:
  api:
    image: fedihmida/hackathon:api
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./pdf:/app/docs/pdf
      - chroma_data:/app/RAG/chroma_db

  web:
    image: fedihmida/hackathon:web
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  chroma_data:
```

---

## 3. Run the Platform

```bash
docker-compose up
```

Wait for the logs to show:

```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 4. Access the Application

Open your browser: **http://localhost:3000**

---

## 5. Using the Platform

### Upload PDFs

1. Place PDF files in the `./pdf` folder you created
2. The system will automatically index them

### Chat with your documents

1. Type your question in the chat
2. The AI will search your documents and provide answers with sources

### Available features

- **RAG Chat**: Ask questions about your uploaded documents
- **Document Summary**: Get AI-generated summaries of PDFs
- **Multi-language**: Supports French and English

---

## 6. Stop the Platform

```bash
docker-compose down
```

To also remove the indexed data:

```bash
docker-compose down -v
```

---

## Troubleshooting

### Container exits immediately

Check logs:

```bash
docker-compose logs api
```

### API key error

Make sure your `.env` file has the correct key format:

```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### Port already in use

Change ports in `docker-compose.yml`:

```yaml
ports:
  - "8001:8000" # API
  - "3001:80" # Web
```

---

## API Endpoints (for developers)

| Endpoint     | Method | Description               |
| ------------ | ------ | ------------------------- |
| `/chat`      | POST   | Chat with RAG (streaming) |
| `/upload`    | POST   | Upload PDF file           |
| `/documents` | GET    | List uploaded documents   |
| `/summarize` | POST   | Summarize a document      |
| `/health`    | GET    | Health check              |

---

**Need help?** Contact the team or check the main repository.
