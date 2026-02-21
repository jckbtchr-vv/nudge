# Nudge

A minimal Chrome extension for mindful X (Twitter) usage tracking with real-time metrics and gentle behavioral nudges.

![Version](https://img.shields.io/badge/version-1.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 📊 Real-Time Tracking
- **Sequential post counting** with gradient-colored pill badges (green → yellow → red)
- **Pixel scroll tracking** to measure engagement depth
- **Minute-by-minute activity** visualization
- **Hourly breakdown** of daily usage

### 🎯 Two Modes
- **Nudge Mode**: Color-coded counters that transition from green to red as you approach your limit
- **Count Mode**: Simple grey counters for minimal distraction

### 📈 Analytics Dashboard
- **Last Hour**: Line graph showing tweet consumption per minute (rolling 60 minutes)
- **Today's Activity**: Bar chart displaying hourly tweet counts
- **Daily History**: 90-day archive with tweets read and pixels scrolled

### ⚡ Smart Features
- Auto-resets daily at midnight
- Persists data across browser sessions
- Configurable post limit (default: 100)
- Pre-loads counters to prevent visual flashing
- Minimal, monospaced VV-inspired aesthetic

## Installation

### From Source
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension directory
6. Visit x.com and start tracking!

### From Chrome Web Store
Coming soon...

## Usage

### Quick Start
1. Install the extension
2. Browse X normally - counters appear automatically after reaching your limit
3. Click the extension icon to view stats and history

### Customization
- **Adjust limit**: Change your daily post threshold
- **Switch modes**: Toggle between Nudge (gradient) and Count (grey) modes
- **View history**: Click "History" to see your usage patterns

## Tech Stack

- Vanilla JavaScript (ES6+)
- Chrome Extension Manifest V3
- SVG for data visualization
- Local storage for persistence

## File Structure

```
nudge/
├── manifest.json       # Extension configuration
├── content.js          # Tweet tracking & counter injection
├── popup.html          # Extension popup UI
├── popup.js            # Stats & history logic
├── styles.css          # Counter pill styling
└── README.md           # This file
```

## Privacy

Nudge operates entirely locally. No data is ever sent to external servers. All tracking data is stored in your browser's local storage.

## Contributing

Contributions welcome! Feel free to open issues or submit pull requests.

## License

MIT License - see LICENSE file for details

## Credits

Inspired by [@visualizevalue](https://visualizevalue.com) aesthetics

---

Built to help you build more and scroll less.
