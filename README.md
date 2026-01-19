# ☁️ Cloud Technologies - Complete Course Site

A comprehensive web application that integrates all 7 modules of the Cloud Technologies course, featuring interactive demos, documentation, and ready-to-use GCP scripts.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
open http://localhost:3000
```

## 📁 Project Structure

```
cloud-technologies-site/
├── index.html              # Main landing page
├── server.js               # Express server with API endpoints
├── package.json            # Dependencies
├── css/
│   ├── style.css           # Main styles
│   └── module-page.css     # Module page styles
├── js/
│   └── main.js             # Frontend JavaScript
├── modules/
│   ├── module-1.html       # Google Apps Script
│   ├── module-2.html       # IaaS - VMs & Storage
│   ├── module-3.html       # 2-Tier Architecture
│   ├── module-4.html       # VPC Networking
│   ├── module-5.html       # PaaS & AI APIs
│   ├── module-6.html       # Machine Learning
│   └── module-7.html       # Load Balancing
├── demos/
│   ├── vision-demo.html    # Vision Pipeline Demo
│   ├── sentiment-demo.html # Sentiment Analyzer
│   └── loadbalancer-demo.html # LB Simulator
└── resources/
    ├── scripts.html        # GCP Commands
    ├── docs.html           # Documentation
    └── links.html          # Useful Links
```

## 🔧 Configuration

### Enable Full API Functionality

1. Create a GCP project
2. Enable APIs:
   - Cloud Vision API
   - Cloud Translation API
   - Cloud Text-to-Speech API
   - Cloud Natural Language API

3. Create a Service Account with appropriate roles
4. Download JSON key
5. Set environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

### Demo Mode

Without GCP credentials, the server runs in **demo mode** with simulated API responses.

## 📚 Modules Overview

| Module | Topic | Key Technologies |
|--------|-------|------------------|
| 1 | Google Apps Script | GAS, Gmail, Sheets, Forms |
| 2 | IaaS - VMs & Storage | Compute Engine, Cloud Storage |
| 3 | 2-Tier Architecture | Node.js, MySQL, VPC |
| 4 | VPC Networking | Subnets, Firewall Rules |
| 5 | PaaS & AI APIs | App Engine, Vision, Translation |
| 6 | Machine Learning | Vertex AI, AutoML |
| 7 | Load Balancing | HTTP LB, Instance Groups |

## 🎮 Interactive Demos

- **Vision Pipeline**: Upload image → Detect objects → Translate → Generate audio
- **Sentiment Analyzer**: Analyze text sentiment with NLP
- **Load Balancer Simulator**: Visualize traffic distribution

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/vision/labels` | POST | Label detection |
| `/api/vision/objects` | POST | Object detection |
| `/api/translate` | POST | Text translation |
| `/api/tts` | POST | Text-to-speech |
| `/api/sentiment` | POST | Sentiment analysis |
| `/api/vision-pipeline` | POST | Full pipeline |

## 🛠️ Development

```bash
# Install dev dependencies
npm install

# Run with auto-reload
npm run dev
```

## 📝 License

MIT

---

Made with ☁️ for Cloud Technologies Course
