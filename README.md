# 💀 HellSync

> A modular, event-driven Discord system built for **automation, economy, moderation, and real-time server intelligence**.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
![Architecture](https://img.shields.io/badge/Architecture-Event--Driven-purple)

---

## 🧠 Overview

HellSync is a **dual-layer Discord ecosystem**:

* ⚙️ **Main Bot (this repo)** → interaction, economy, automation
* 🛡️ **Anti-Nuke Bot** → security, enforcement

But what makes HellSync powerful is:

> It operates as a **real-time event-driven system**, not just command-response.

---

## ⚡ Core Architecture

```text
Discord Events → Event Handlers → Systems → Actions → Logs
```

HellSync continuously listens to:

* messages
* edits
* joins
* leaves
* invites
* interactions

👉 and reacts **instantly**

---

## 🔥 Event System (Core Intelligence Layer)

### 💬 Message Pipeline

* Prefix command handling
* Automod enforcement
* Spam detection + timeout
* Bad word filtering
* Anti-link + anti-caps + anti-mention

```js
runAutomod(message)
```

👉 Fully dynamic rule-based moderation


---

### 📝 Message Logging System

* Tracks:

  * Message deletions
  * Message edits
* Uses audit logs to detect:

  * Who deleted what
* Logs attachments + content

👉 Dyno-level logging system
 

---

### 👤 Member Lifecycle System

#### Join System

* Auto-role assignment with permission checks
* Invite tracking (who invited whom)
* Suspicious account detection (<7 days)

👉 This is **rare and advanced**


---

#### Leave / Kick Detection

* Detects:

  * voluntary leave
  * kick (via audit logs)

👉 Clean moderation tracking


---

### 🔗 Invite Intelligence System

* Tracks invite usage per code
* Maintains live invite cache
* Detects which invite was used

👉 This is **non-trivial to implement correctly**
 

---

### ⚡ Interaction Engine

* Slash command routing
* Modal handling (embed builder system)
* Button interactions
* Real-time UI flows

👉 Example:

* Create embed → preview → confirm → send



---

### 🚀 Ready Event (Boot System)

* Loads all commands dynamically
* Registers slash commands globally
* Initializes config
* Sets bot activity

```js
loadCommands(client)
```



---

## 💰 Economy System (Persistent)

* Wallet + Bank system
* Daily streak rewards
* Work system (cooldowns)
* Transfers between users
* Deposit / Withdraw

👉 Fully MongoDB-backed
  

---

## 🎰 Interactive Economy Mechanics

* Gambling system (dice, coin, slots, number)
* Rob system (PvP economy interaction)
* Leaderboards (server-based ranking)

👉 This creates an **actual gameplay loop**
 

---

## 🛒 Shop & Inventory

* Server shop system
* Admin-controlled items
* Inventory storage
* Purchase system

 

---

## 🎵 Music System

* Queue + playback control
* Loop, volume, skip
* Lyrics + now playing

---

## 🛠️ Utility & Automation

* Auto-role
* Reminder system
* Invite tracking
* Custom embed builder (modal UI)

---

## 📊 Logging System

* Message delete/edit logs
* Join/leave logs
* Invite tracking logs

👉 Fully configurable logging pipeline

---

## 🧩 Folder Structure

```text
src/
├── commands/
│   ├── economy/
│   ├── moderation/
│   ├── utility/
│   ├── music/
│   ├── info/
│   └── fun/
├── events/
├── models/
├── utils/
├── config/
└── index.js
```

---

## 🧠 Design Philosophy

* Event-driven architecture
* Modular command system
* Dual execution (prefix + slash)
* Persistent + scalable
* Separation of concerns

---

## 🛡️ Anti-Nuke Integration

HellSync works alongside a **dedicated protection bot**:

* Raid detection
* Audit log monitoring
* Trusted user system
* Auto punishment

👉 Keeps core bot clean and fast

---

## 🚀 Setup

```bash
git clone https://github.com/your-username/hellsync.git
cd hellsync
npm install
```

```env
DISCORD_TOKEN=your_token
CLIENT_ID=your_client_id
MONGODB_URI=your_mongo_uri
```

```bash
node src/index.js
```

---

## ⚠️ Requirements

* Node.js 18+
* MongoDB
* Discord bot token

---

## 🔮 Future Vision

* 🤖 AI integration (Orion)
* 📊 Web dashboard
* 🧠 smart automations
* 🌐 hosted multi-server system

---

## 💜 Philosophy

HellSync is not a bot.

It’s:

> a system that listens, reacts, and evolves with your server

---

## 👑 Author

Built by **Saanvi**

> Systems > Scripts
