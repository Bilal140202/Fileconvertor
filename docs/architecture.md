# Architecture

This repository implements a client-side image conversion suite with a web-worker based conversion queue.

Phase 2A focuses on:

- Worker/queue plumbing with progress + cancellation
- Image conversion adapter supporting common formats and transform options
- Batch download (zip) support
- Adapter-level tests with deterministic fixtures
