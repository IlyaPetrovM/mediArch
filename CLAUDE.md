# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mediArch** is a media archive application for managing and cataloging media files (photos, audio, video) with features including:
- File upload and management with support for large files via chunked uploads
- Audio file recognition (speech-to-text) using Yandex Speech API and Vosk
- Event and informant tracking with GPS data
- Photo marking/annotation with geolocation
- User authentication and session management
- Full-text search and filtering via MySQL queries

## Architecture

### Backend (Node.js + Express)
- **Main entry point**: `app/index.js` - Express server initialization, routing, middleware, session management
- **Database config**: `app/config.js` - Database connection settings (supports env vars), upload path, API keys
- **Users**: `app/users.js` - Authentication data and user validation logic
- **Audio recognition**: `app/recognizeAudio.js` - Audio file processing with FFmpeg segmentation, Yandex Speech API integration

### Frontend (Vanilla JavaScript)
- **Entry point**: `app/public_html/index.html` - Login page
- **JavaScript modules** in `app/public_html/js/`:
  - `main.js` - Core application logic
  - `login.js` - Authentication flow
  - `files.js` - File management and uploads (chunked upload handler)
  - `events.js` - Event management
  - `informants.js` - Informant/person management
  - `marks.js` - File annotations and marks
  - `photo_marks.js` - Photo-specific marking
  - `search.js` - Search functionality
  - `table.js`, `map.js`, `player.js` - UI components and viewers
- **Styles**: `app/public_html/style/` - CSS for each page

### Database (MariaDB)
- Initialization script: `init-db/create_database_structure.sql`
- Main tables: `events`, `files`, `files_to_informants`, `informants`, `marks`, `photo_marks`, `users`
- Connected via MySQL driver in Node.js

### Storage
- **Uploads directory**: `storage/mediarch/uploads/` (mounted as volume in Docker to `app/public_html/uploads/`)
- User-uploaded files and temporary processing files stored here

## Development & Deployment

### Docker Setup
```bash
# Build and start all services
docker-compose build
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs mediarch --tail=50
docker-compose logs mariadb --tail=20
```

Services:
- **mediarch**: Node.js application on port 3000
- **mariadb**: MySQL on port 3306

### Local Development (without Docker)
```bash
cd app
npm install
npm start
```
Requires local MariaDB instance with database initialized from `init-db/create_database_structure.sql`.

### Key API Endpoints
- `POST /api/login` - User authentication
- `POST /api/upload` - Single file upload
- `POST /api/upload/chunks` - Chunked file upload (for large files)
- `GET /api/file/size`, `GET /api/file/hash` - File metadata
- `POST /api/sql` - Execute SELECT queries and return full result sets
- `POST /api/sql/dataOnly` - Execute SELECT queries, return data only
- `POST /api/speech-recognition` - Trigger audio recognition on uploaded file
- `GET /api/servertime` - Server timestamp
- `POST /api/session/username` - Get current user's username
- `POST /api/session/end` - Logout

### Important Notes

**Memory Management**: The app sets max heap size to 4GB via V8 flags to handle large file processing:
```javascript
v8.setFlagsFromString('--max-old-space-size=4096');
```

**Audio Recognition** ⚠️ **DEPRECATED**:
- **Status**: Speech recognition is currently NOT being used
- **Deprecated technology**: Yandex Speech API (legacy implementation)
- **Future replacement**: Will be replaced with faster-whisper
- Legacy implementation details:
  - Requires FFmpeg for audio segmentation
  - Uses Yandex Speech API for speech-to-text (API key in config.js)
  - Audio files are split into 60-second segments via FFmpeg before recognition
  - Each segment must be ≤1MB before sending to Yandex API
  - Recognized text stored in `files.recognizedText` with marks/timecodes in `marks` table

**File Uploads**:
- Supports files up to 1000 GB (limit in fileUpload middleware)
- Chunked upload splits large files on client-side before sending
- Uploaded files stored in `storage/mediarch/uploads/`

**Authentication**: Simple session-based auth with in-memory store (note: logs warning about MemoryStore not suitable for production)

**File Structure in Docker**:
- Application code: copied into `/app` container directory
- Node modules: mounted as volume to persist between container restarts
- Storage: `./storage/mediarch/uploads/` mounted to `/app/public_html/uploads/` in container

## Database Credentials
- User: `mediarch_user`
- Password: `mediarch_password` (defined in docker-compose.yml and config.js)
- Database: `mediarch`
- Host in Docker: `mariadb` (service name)

## Node Version & Warnings
- Built on Node 16 Alpine
- Several deprecated dependencies (crypto, multer 1.x, uuid@3)
- 6 vulnerabilities reported during npm install (4 moderate, 2 critical)
- Consider upgrading dependencies in `app/package.json` for security
