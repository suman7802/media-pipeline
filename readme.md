# Media Pipeline 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-brightgreen.svg)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18.20.3-green.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

A media pipeline for processing and streaming media files. This project supports uploading, processing, and streaming both images and videos with features like transcoding, chunking, and thumbnail generation. It also includes monitoring capabilities via Prometheus and Grafana.

---

## Table of Contents 📚

* [Description](#description)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Configuration](#configuration)
* [Usage](#usage)

  * [Starting the Application](#starting-the-application)
  * [Workers & Background Jobs](#workers-and-background-jobs)
* [Project Structure](#project-structure)
* [API Reference](#api-reference)
* [API Documentation](#api-documentation)
* [TODO / Roadmap](#todo-roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Important Links](#important-links)
* [Footer](#footer)

---

<a id="description"></a>

## Description 📝

The **Media Pipeline** is a versatile backend service designed to handle media files efficiently at scale. It allows users to upload media, process it by generating various renditions and thumbnails, and stream or serve it to clients.

The backend is built with **TypeScript**, **Express**, and **Node.js**, utilizing **FFmpeg** for media processing, **Sharp** for image manipulation, and **PM2** for production process management. It incorporates **Prometheus** and **Grafana** for metrics and monitoring.

This project is:

* **Modular & extensible** – suitable for a wide range of media-related applications.
* **Well maintained** – built on top of the author's own hardened Express template.
* **Multi-language ready** – includes internationalization with English and Nepali via `i18next`.
* **Security-focused** – leverages the author's Express template for security best practices, structure, and middleware:
  👉 [suman7802/ExpressTemplate](https://github.com/suman7802/ExpressTemplate)

> ⚠️ **Note:** The frontend/demo UI is **not fully ready yet**. At the moment, you still need to **manually paste media IDs** on the frontend to test streaming or image serving. See the [TODO / Roadmap](#todo-roadmap) section for planned improvements.

---

<a id="features"></a>

## Features ✨

* **Media Upload**: Accepts both image and video files. 📤
* **Automated Media Processing**: Automatically processes uploaded media files via background workers.
* **Video Transcoding**: Transcodes videos into multiple resolutions (240p, 360p, 480p, 720p, 1080p). 🎬
* **Image Resizing**: Generates resized images in multiple sizes (3840, 2560, 1920, 1280, 854). 🖼️
* **Thumbnail Generation**: Creates thumbnails for both video and image files. 🖼️
* **Chunked Video Streaming**: Streams video files using HTTP range requests for efficient playback. 🎦
* **Image Format Conversion**: Converts images to multiple formats (e.g., WebP, JPEG). 🔄
* **Rate Limiting**: Built-in rate limiting to prevent abuse and protect resources. 🛡️
* **Metrics & Monitoring**: Exposes application metrics in Prometheus format and integrates with Grafana dashboards. 📊
* **Internationalization (i18next)**: Multi-language support (currently English & Nepali) with an extensible i18n setup. 🌐
* **Security & Best Practices**: Built on top of [ExpressTemplate](https://github.com/suman7802/ExpressTemplate), which provides a secure, opinionated Express boilerplate.

---

<a id="tech-stack"></a>

## Tech Stack 🛠️

* **Backend**: Node.js, Express, TypeScript
* **Media Processing**: FFmpeg, Sharp
* **Streaming**: HTTP range requests, chunked streaming
* **Validation & Types**: Zod, TypeScript
* **Logging**: Winston
* **Metrics & Monitoring**: Prometheus, Grafana
* **Process Management**: PM2
* **Internationalization**: i18next

---

<a id="prerequisites"></a>

## Prerequisites 🧰

Before running the project locally, make sure you have:

* **Node.js** (version 18.x, e.g. `18.20.3`)
* **npm**, **pnpm**, or **yarn**
* **FFmpeg** installed and available on your system `PATH`
* **PM2** installed globally (or available in the project):

  ```bash
  npm install -g pm2
  ```

> ⚠️ The server uses FFmpeg both in the main process and in the background worker. If `FFMPEG_PATH` is not set, it assumes `ffmpeg` is available on the `PATH`.

---

<a id="installation"></a>

## Installation ⚙️

1. **Clone the repository:**

   ```bash
   git clone https://github.com/suman7802/media-pipeline.git
   cd media-pipeline
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file based on `.env.example` and configure the necessary environment variables:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   nano .env.local
   ```

   Key environment variables:

   * `PORT`: Port the server will listen on (default: `8080`).
   * `NODE_ENV`: `development` or `production`.
   * `LOG_LEVEL`: Logging level (`dev`, `short`, `combined`, `common`, `tiny`).
   * `CLIENT_URL`: URL of the client app (for CORS).
   * `API_KEY`: API key required to access protected endpoints.
   * `MEDIA_DIR`: Directory to store processed media (default: `./media`).
   * `RAW_DIR`: Directory to store raw uploaded files (default: `./raw`).
   * `TEMP_UPLOAD_PATH`: Temporary directory for uploads (default: `./temp`).
   * `FFMPEG_PATH`: Path to the FFmpeg binary (if omitted, uses `ffmpeg` from `PATH`).
   * `QUEUE_DIR`: Directory for queue files / background jobs (default: `./queue`).

4. **Build the project (for production / type-checked output):**

   ```bash
   npm run build
   ```

---

<a id="configuration"></a>

## Configuration ⚙️

Configuration is driven primarily by environment variables, using `dotenv-flow`. Main configuration files:

* `.env.example` – Example environment configuration.
* `ecosystem.config.js` – PM2 configuration (process definitions for server & workers).
* `tsconfig.json` – TypeScript compiler options.
* `prometheus.yml` – Prometheus scrape configuration (for metrics collection).

---

<a id="usage"></a>

## Usage 🎬

<a id="starting-the-application"></a>

### Starting the Application

#### Development Mode

```bash
npm run dev
```

* Uses `tsx` in watch mode.
* Automatically recompiles and restarts the server on file changes.
* Good for local iteration on the HTTP API (request/response layer).

#### Production Mode

1. **Using Node.js directly (after build):**

   ```bash
   npm start
   ```

   * Starts the server using the compiled JS in the `build` directory.
   * Make sure to run `npm run build` at least once beforehand.

2. **Using PM2 (recommended for production):**

   PM2 is used to run and manage processes in production (server and worker):

   * Start the application in development mode via PM2:

     ```bash
     npm run pm2:dev
     ```

   * Start the application in production mode via PM2:

     ```bash
     npm run pm2:prod
     ```

   The exact processes are defined in `ecosystem.config.js`.

<a id="workers-and-background-jobs"></a>

### Workers & Background Jobs

This project uses a **background worker** to handle CPU-intensive and asynchronous tasks (such as video transcoding, image processing, queue handling, etc.) separately from the HTTP request/response lifecycle.

An example `package.json` script for the worker is:

```json
"scripts": {
  "dev": "cross-env NODE_ENV=development tsx watch src/app.ts",
  "worker": "cross-env NODE_ENV=development FFMPEG_PATH=/opt/homebrew/bin/ffmpeg tsx src/workers/worker-runner.worker.ts"
}
```

> 🔧 Adjust `FFMPEG_PATH` according to your OS and FFmpeg installation path.

#### Running Locally (without PM2)

When running locally in **development**, you typically need **two terminals**:

* **Terminal 1 – HTTP server (request/response):**

  ```bash
  npm run dev
  ```

* **Terminal 2 – Background worker (job handler):**

  ```bash
  npm run worker
  ```

The worker script (`src/workers/worker-runner.worker.ts`) is responsible for:

* Reading jobs from the queue (`QUEUE_DIR`)
* Invoking FFmpeg and Sharp-based processors
* Updating media status and metadata
* Offloading heavy tasks from the main HTTP thread

#### Running in Production (with PM2)

In production, PM2 (via `ecosystem.config.js`) can be configured to run:

* One or more **API server** processes.
* One or more **worker** processes.

Check `ecosystem.config.js` to see how the `worker` process is defined and scaled.

---

### Accessing Metrics

* **Metrics Endpoint**: `/metrics`
  Exposes application metrics in Prometheus format.

* **Grafana Dashboard**
  Grafana can be configured to visualize the metrics exposed by Prometheus.
  Typical local setup (if you run Grafana yourself) is at: `http://localhost:3000` with default credentials `admin:admin` (change this in production).

---

<a id="project-structure"></a>

## Project Structure 🌳

```text
media-pipeline/
├── .env.example               # Example environment variables
├── ecosystem.config.js        # PM2 configuration (server + worker processes)
├── package.json               # Node.js project dependencies and scripts
├── prometheus.yml             # Prometheus scrape configuration
├── public/                    # Publicly accessible static files (HTML, CSS, JS)
│   └── index.html
├── src/                       # Source code
│   ├── app.ts                 # Main application entry point
│   ├── configs/               # Configuration modules
│   ├── constants/             # Constant values
│   ├── controllers/           # Route handlers
│   ├── errors/                # Custom error classes and error handling
│   ├── helpers/               # Helper / utility functions
│   ├── lib/                   # External library integrations (FFmpeg, Sharp, etc.)
│   ├── loggers/               # Logging setup (Winston, formats)
│   ├── middlewares/           # Express middlewares
│   ├── routers/               # API route definitions
│   ├── schemas/               # Data validation schemas (Zod)
│   ├── services/              # Business logic and data processing
│   ├── streaming/             # Streaming-related classes and utilities
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Generic utility functions
│   └── workers/               # Background job processors & worker runner
├── tsconfig.json              # TypeScript configuration
```

---

<a id="api-reference"></a>

## API Reference 🌐

| Method | Endpoint                         | Description                                   | Requires           |
| :----- | :------------------------------- | :-------------------------------------------- | :----------------- |
| POST   | `/api/v0/media/upload`           | Uploads a media file (image or video).        | `x-api-key` header |
| GET    | `/api/v0/media/browse`           | Lists all media files.                        |                    |
| GET    | `/api/v0/media/image/:id`        | Serves a resized image rendition.             |                    |
| GET    | `/api/v0/media/video/:id/stream` | Streams a video rendition (supports quality). |                    |
| GET    | `/metrics`                       | Exposes application metrics for Prometheus.   |                    |
| GET    | `/api/v0/health`                 | Health check endpoint.                        |                    |

### Example Requests

#### Upload Media File

```bash
curl -X POST http://localhost:8080/api/v0/media/upload \
  -H "x-api-key: your_api_key_to_access_the_api" \
  -F media_file=@/path/to/your/file.mp4 \
  -F title="My Video" \
  -F tags=video,funny
```

#### Stream Video

```html
<video controls>
  <source src="http://localhost:8080/api/v0/media/video/01H9ZZ9Z0000K000000000/stream?quality=720p" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

#### Serve Image

```html
<img
  src="http://localhost:8080/api/v0/media/image/01H9ZZ9Z0000K000000000?size=1920&format=webp"
  alt="My Image"
/>
```

---

<a id="api-documentation"></a>

## API Documentation 📖

A full Postman documentation (collection) is available here:

👉 **Postman Docs**: [https://documenter.getpostman.com/view/46183183/2sB3WyKGmu](https://documenter.getpostman.com/view/46183183/2sB3WyKGmu)

You can explore all endpoints, payloads, and example responses there.

---

<a id="todo-roadmap"></a>

## TODO / Roadmap 🧭

Things that still need to be done / improved:

* **Frontend integration (important)**

  * Replace the current manual ID entry in the frontend with a proper integration that:

    * Calls `/api/v0/media/browse` to list available media.
    * Allows selecting a media item from the UI instead of pasting IDs.
    * Automatically wires selected IDs into the video player / image components.

* **Frontend polish & UX**

  * Add proper loading / error states for uploads, streaming, and image loading.
  * Integrate the same i18next languages (English, Nepali) on the frontend so UI texts match backend localization.
  * Add basic layout & styling for a nicer demo UI.

* **Authentication & API key management**

  * Provide a simple flow (CLI or small admin endpoint/UI) to manage `API_KEY` values.
  * Optionally support multiple keys with different permissions or rate limits.

* **Improved metrics dashboards**

  * Create ready-made Grafana dashboards for:

    * Media processing latency & throughput.
    * Queue depth and worker processing time.
    * Error rate per endpoint / job type.

* **Queue & worker observability**

  * Add endpoints or logs/metrics for:

    * Current queue size (pending / in-progress / failed jobs).
    * Per-job statistics (average processing time, retries).

* **Storage & deployment enhancements**

  * Optional support for cloud/object storage (e.g. S3-compatible) instead of only local filesystem.
  * Additional documentation for production deployments (systemd, PM2 cluster mode, etc.).

* **Testing**

  * Extend unit and integration tests for controllers, services, and workers.
  * Add basic load tests for streaming endpoints to validate performance under high concurrency.

---

<a id="contributing"></a>

## Contributing 🤝

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive messages.
4. Add or update tests where appropriate.
5. Test your changes thoroughly.
6. Submit a pull request.

Issues, feature requests, and suggestions are always appreciated.

---

<a id="license"></a>

## License 📜

This project is licensed under the **ISC License** – see the [LICENSE](LICENSE) file for details.

---

<a id="important-links"></a>

## Important Links 🔗

* **Project Repository**: [https://github.com/suman7802/media-pipeline](https://github.com/suman7802/media-pipeline)
* **Author's Website**: [https://sumansharma.me](https://sumansharma.me)
* **Express Template (Security & Boilerplate)**: [https://github.com/suman7802/ExpressTemplate](https://github.com/suman7802/ExpressTemplate)
* **API Docs (Postman)**: [https://documenter.getpostman.com/view/46183183/2sB3WyKGmu](https://documenter.getpostman.com/view/46183183/2sB3WyKGmu)

---

<a id="footer"></a>

## Footer 🦶

**Media Pipeline** – [https://github.com/suman7802/media-pipeline](https://github.com/suman7802/media-pipeline)
Developed by [Suman Sharma](https://sumansharma.me) – Contact: `mansu7802@gmail.com`

⭐️ **Star the repo**, **fork it**, report issues, and contribute!
