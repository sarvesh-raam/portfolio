# Sarvesh Raam - Portfolio Website

A premium, ultra-minimal, Apple-inspired portfolio website showcasing AI engineering work.

---

## Architecture & Technical Implementation

This portfolio is built on a custom, lightweight, framework-agnostic architecture prioritizing rendering speed and clean state management.

- **Frontend Core**: Pure HTML5, Vanilla CSS3, and Vanilla JavaScript.
- **Data Integration**: Real-time synchronization with the GitHub REST API to dynamically fetch and display repository metrics.
- **Performance Optimization**: Lazy loading of assets, hardware-accelerated CSS transforms for animations, and localized caching of API responses to minimize network overhead.
- **Design System**: A custom CSS variable-driven design system enforcing consistent typography, spacing, and color palettes.

## Project Case Studies

The portfolio highlights detailed case studies of my most impactful work:

1. **ARIA (Autonomous Risk Intelligence Agent)**: A high-performance RAG system utilizing LangGraph and Groq for forensic financial data analysis.
2. **Scholarship Management Portal**: A full-stack Flask application managing financial aid distribution with real-time budget tracking.
3. **Smart College Carpooling System**: A secure, verified commute-sharing platform for university networks.

Each case study details the system architecture, the technical challenges overcome, and the measurable impact of the solution.

## Deployment & Setup

### Local Environment
For the best experience with real-time GitHub integration, run a local server:

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

Access the site at: `http://localhost:8000`

## Repository Structure

```text
portfolio/
├── index.html      # Main Document Object Model structure
├── style.css       # Design tokens and styling rules
└── script.js       # Dynamic API fetching and DOM manipulation
```

## Future Roadmap
- Implementation of a headless CMS for dynamic case study generation.
- Integration of a 3D WebGL element for interactive data visualization.
