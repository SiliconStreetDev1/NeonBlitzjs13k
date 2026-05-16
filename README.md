# ⚡ Neon Blitz ⚡

**Neon Blitz** is a hacking puzzle game built entirely with Vanilla JavaScript and HTML5 Canvas. **This project is a micro-game example created to showcase the RLO Audio Engine (specifically `RLOCore`) operating under extreme size constraints like the js13kGames 13KB limit.** Trace paths, memorize the grid, and survive hazardous anomalies while listening to a fully generative piano soundtrack synthesized dynamically at runtime!

## 🌟 Features

- **Fast-Paced Puzzle Action:** Swipe across the grid to connect targets, manage your time, and push for high scores through a progressive difficulty curve.
- **Ultra-Lightweight Procedural Audio:** Powered by `RLOCore`. It converts sequence files into highly-compressed 1D numerical arrays and synthesizes music at runtime using pure mathematics, entirely bypassing large MP3 or OGG audio files.
- **js13kGames Ready:** The entire game—including logic, graphics, and dynamic soundtrack—compiles to a ZIP file smaller than 13 kilobytes.
- **Dynamic Hazards:** Face ever-evolving board mechanics including Chameleon blocks, Memory Leaks, and Trace Overloads.

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/SiliconStreetDev1/NeonBlitzjs13k
   cd NeonBlitzjs13k
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run it
   ```bash
      npm run preview
   ```
   The game will be available at `http://localhost:5173`.


## 🛠️ Tech Stack

- **Vite:** Next-generation frontend tooling for rapid development and optimized builds.
- **Vanilla JS (ES Modules):** Zero heavy frameworks. High-performance, class-based architecture.
- **HTML5 Canvas:** Custom-built rendering loop for fast 60fps+ line tracing.
- **Web Audio API:** Music sequenced by `RLOCore`, with custom oscillators handling SFX to save bytes.

## 📜 License

MIT License

## ⚠️ Disclaimer

This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.
