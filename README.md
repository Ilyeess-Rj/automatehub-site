# 🦁 AutomateHub • MIR AI Assistant ⚡
> A high-performance, edge-streamed AI assistant powered by NVIDIA NIM, real-time web search, and workflow automation.

<p align="center">
  <img src="logo.png" alt="AutomateHub Logo" width="110" style="filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.5));" />
</p>

<p align="center">
  <a href="https://automatehub-site.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-AutomateHub-8b5cf6?style=flat-square&logo=vercel" alt="Live Demo"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/Powered%20By-NVIDIA%20NIM-76b900?style=flat-square&logo=nvidia" alt="NVIDIA">
  <img src="https://img.shields.io/badge/Search-Tavily%20AI-0284c7?style=flat-square" alt="Tavily">
  <img src="https://img.shields.io/badge/Runtime-Vercel%20Edge-black?style=flat-square&logo=vercel" alt="Runtime">
</p>

---

## 💡 About AutomateHub & MIR

**AutomateHub** is an independent AI & automation project created by **Mohammed Ilyes Rajhi**.

At its center is **MIR ⚡**, an interactive AI assistant engineered for speed, accuracy, and daily utility. Unlike standard static chatbots whose knowledge stops at their training cutoff date, MIR connects directly to the live web via **Tavily AI Search** when needed, providing factual, up-to-date answers for news, sports, tech updates, and practical research.

The project is built on **Vercel Edge Runtime**, delivering lightning-fast token streaming (SSE) directly to the browser with zero server latency.

---

## ✨ Core Features

* ⚡ **Sub-Second Streaming:** Server-Sent Events (SSE) stream responses token-by-token with near-instant first-token delivery.
* 🌐 **Live Web Search Grounding:** Automatically detects when fresh data or current events are required and fetches live facts via Tavily AI Search.
* 🧠 **NVIDIA NIM Intelligence:** Powered by Meta's Llama 3.2 Vision model hosted on high-throughput NVIDIA inference hardware.
* 🗣️ **Multilingual Understanding:** Fluent in English, French, Standard Arabic, and Tunisian dialect.
* 🎨 **Clean Dark Interface:** Sleek, distraction-free glassmorphic design that works smoothly across desktop and mobile screens.
* 🔒 **Secure Architecture:** API keys and sensitive credentials are encrypted and kept entirely server-side in Edge environments.

---

## 🛠️ Architecture & Tech Stack

```text
[ Browser / User UI ]  <--- (Fast SSE Streaming) ---  [ Vercel Edge Runtime (api/chat.js) ]
                                                                 │
                                          ┌──────────────────────┴──────────────────────┐
                                          ▼                                             ▼
                              [ Tavily Web Search ]                        [ NVIDIA NIM API ]
                             (Live Facts & Current Data)                 (Llama 3.2 11B Vision)
```

* **Frontend:** Modern HTML5, Vanilla JavaScript, CSS3 Glassmorphism (zero bloat, pure speed).
* **Backend:** Vercel Edge Functions (V8 Isolates, streaming responses).
* **AI Model:** Llama 3.2 11B Vision via NVIDIA NIM.
* **Search Engine:** Tavily AI Search API.

---

## 🚀 Active Roadmap & Planned Features 💪

AutomateHub is under active, steady development. New capabilities are being integrated step-by-step:

- [ ] 📸 **Multimodal Vision:** Upload and analyze images, diagrams, and screenshots directly in chat.
- [ ] 📄 **Document Processing:** Support for PDF and document parsing for fast summaries and Q&A.
- [ ] 🔄 **Workflow & Automation Tools:** Pre-built templates and helpers for n8n, webhook integrations, and API tasks.
- [ ] 💻 **Interactive Code Assistant:** Enhanced code blocks with syntax highlighting and 1-click copy.
- [ ] 💾 **Persistent Chat History:** Save and resume conversation sessions securely.

---

## 🌐 Live Platform

* 🚀 **Primary URL:** [https://automatehub-site.vercel.app/](https://automatehub-site.vercel.app/)
* 🌐 **Custom Domain:** [https://automatehub.dpdns.org/](https://automatehub.dpdns.org/)

---

## ⚖️ License

Distributed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) for details.

```text
Copyright © 2026 Mohammed Ilyes Rajhi (AutomateHub).
Licensed under the Apache License, Version 2.0.
```

---

## 🤝 Connect & Collaborate

Interested in custom AI agents, automated workflows (n8n, APIs), or collaborating on web development? Feel free to reach out:

* 📧 **Email:** [rajhimohamedilyes@gmail.com](mailto:rajhimohamedilyes@gmail.com)
* 🐙 **GitHub:** [@Ilyeess-Rj](https://github.com/Ilyeess-Rj)
* 💼 **Project Brand:** **AutomateHub** • Created & maintained by Mohammed Ilyes Rajhi

<p align="center">
  <sub>Built with care and continuous improvement 💪⚡</sub>
</p>
