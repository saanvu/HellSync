# 🔥 HellSync

<p align="center">
  <b>A modular Discord system built for scale, interaction, and control.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/System-Dual%20Bot%20Ecosystem-8A2BE2?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Architecture-Event%20Driven-22c55e?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Music-Lavalink-ff69b4?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Database-MongoDB-green?style=for-the-badge"/>
</p>

---

## 🧠 What is HellSync?

HellSync is a **modular Discord bot system** designed to handle:

* 🎮 Engagement
* 🎵 Music streaming
* ⚙️ Server utilities
* 🛡️ Moderation
* 📊 Tracking systems

But more importantly:

> It is part of a **dual-bot architecture**, working alongside a dedicated Anti-Nuke system for full server control and protection.

---

## ⚡ Core Capabilities

### 🎧 Advanced Music System

* Powered by **Lavalink nodes**
* Queue management + auto handling
* Multi-platform search support

```js
defaultSearchPlatform: "spsearch"
fallbackSearch: "scsearch"
```

👉 Production-style music architecture


---

### 🧠 Modular Command Engine

* Category-based structure:

  * economy
  * fun
  * info
  * moderation
  * music
  * setup
  * utility

👉 Commands are dynamically loaded at runtime

---

### ⚡ Event-Driven Core

* Dedicated `events/` system
* Clean separation of logic
* Scalable + maintainable

---

### 📊 Invite Tracking System

* Tracks invite usage per guild
* Detects join sources
* Maintains real-time invite cache

👉 Rare feature in custom bots

---

### 🛠️ Automation & Moderation Systems

* Auto-role assignment
* Warning tracking
* Automod configuration
* Logging system

---

### 🧠 Persistent Data Layer

* MongoDB integration
* Configurable per-server data

```js
mongodb: process.env.MONGODB_URI
```



---

## 🏗️ Architecture

```id="z7f1pg"
HellSync (Main Bot)

├── Core
│   ├── index.js (startup + orchestration)
│   ├── config.js
│
├── Commands
│   ├── economy/
│   ├── fun/
│   ├── info/
│   ├── moderation/
│   ├── music/
│   ├── setup/
│   └── utility/
│
├── Events
│   └── Event handlers
│
├── Models
│   └── Data schemas
│
├── Utils
│   └── Helpers (DB, logic, etc.)
```

---

## 🔗 HellSync Ecosystem

HellSync is built as a **dual-system architecture**:

```id="w3l5hx"
Main Bot → Features, interaction, music
Anti-Nuke → Security, protection, enforcement
```

👉 Separation of concerns = better stability + scalability

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

---

### 2. Configure `.env`

```env
DISCORD_TOKEN=your_token
CLIENT_ID=your_client_id
MONGODB_URI=your_mongo_uri
```

---

### 3. Run

```bash
node src/index.js
```

---

## 🔮 Roadmap

* 🤖 AI-powered commands
* 📊 Advanced analytics dashboard
* 🎵 Multi-node Lavalink scaling
* 🧠 Smart moderation insights
* 🌐 Web dashboard

---

## ⚠️ Disclaimer

HellSync requires:

* Proper Discord permissions
* Lavalink node setup for music
* MongoDB for persistence

---

## 💜 Philosophy

HellSync is not just a bot.

It’s:

> A system designed to scale with your server
> while staying modular, clean, and powerful.

---

## ✦ Author

Built by **Saanvi**

> Systems over scripts. Always.
