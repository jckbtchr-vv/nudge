# Nudge

Chrome extension for X usage tracking and behavioral modification through visual indicators.

## Features

### Tracking
- Sequential post counting with color-coded indicators
- Pixel scroll distance measurement
- Per-minute activity logging
- Hourly usage aggregation

### Display Modes
- Nudge: Progressive color gradient from green to red based on threshold proximity
- Count: Uniform grey indicators

### Data Visualization
- 60-minute rolling line graph
- 24-hour bar chart
- 90-day historical archive

### Behavior
- Daily reset at midnight UTC
- Persistent storage across sessions
- Configurable threshold value
- Pre-rendered counters

## Installation

### From Source
1. Clone repository
2. Navigate to chrome://extensions/
3. Enable Developer mode
4. Load unpacked extension
5. Select directory

### From Chrome Web Store
Available upon approval

## Configuration

- Threshold: Adjustable post limit
- Mode: Toggle between Nudge and Count
- History: Access via dedicated tab

## Architecture

- JavaScript ES6+
- Chrome Extension Manifest V3
- SVG rendering
- chrome.storage.local API

## File Structure

```
manifest.json       Extension configuration
content.js          Tracking and DOM injection
popup.html          Interface markup
popup.js            Data processing and display
styles.css          Visual styling
icon16.png          16x16 icon
icon48.png          48x48 icon
icon128.png         128x128 icon
```

## Privacy

All data stored locally. No external transmission. No analytics. No tracking beyond local usage metrics.

## License

MIT

## Attribution

Visual design influenced by visualizevalue.com
