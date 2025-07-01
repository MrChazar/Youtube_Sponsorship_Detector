# Youtube_Sponsorship_Detector

YouTube Premium users often pay for an ad-free experience but are still exposed to sponsored content embedded by creators. Our project aims to detect and skip these segments, giving users a cleaner viewing experience.

## Project Overview

This solution uses a machine learning model to detect sponsored segments in YouTube videos. Identified segments are marked or skipped automatically. The system consists of:

- **Browser Extension (Frontend)**: Built with JavaScript (React). Displays video information and the status of sponsor detection. It communicates with the backend and handles sponsor skipping.
- **Backend (FastAPI)**: A REST API written in Python. It connects the extension with the sponsor detection model.
- **Model**: Uses Python's `whisper-timestamped` and Gemini to detect product or service promotions in videos.

## Requirements

- Python 3.10
- Install dependencies with:
  ```bash
  pip install -r requirements_lean.txt

## How to Use
- Run the backend:
- Load the browser extension:
- - Go to chrome://extensions
- - Enable "Developer mode"
- - Click "Load unpacked" and select the dist folder of the project
- Open YouTube and enjoy sponsor-free videos.

