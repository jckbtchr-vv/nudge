# Nudge

Chrome extension for X usage tracking, behavioral modification, and bookmark psychology analysis.

## Features

### Usage Tracking
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

### 🧠 NEW: Bookmark Psychology Analyzer
Automatically analyzes your Twitter/X bookmarks using Claude AI to reveal:

**Persuasion Techniques** - Identifies rhetorical devices used in bookmarked content:
- Social proof ("10,000 people did this")
- Authority appeals ("As an expert...")
- Scarcity/urgency ("Limited time")
- Emotional appeals (fear, aspiration, belonging)
- Storytelling and narrative structure
- Reciprocity patterns
- Contrast and anchoring

**Cognitive Biases** - Reveals patterns in your bookmarking behavior:
- Confirmation bias (bookmarking content that confirms existing beliefs)
- Authority bias (trusting content based on who said it)
- Bandwagon effect (bookmarking popular content)
- Availability heuristic (bookmarking recent/vivid examples)
- Survivorship bias (only seeing success stories)

**Overall Patterns** - Meta-analysis of what your bookmarks reveal about your thinking patterns and susceptibilities to persuasion

### Behavior
- Daily reset at midnight UTC
- Persistent storage across sessions
- Configurable threshold value
- Pre-rendered counters
- Automatic batch processing of bookmarks (default: 10 bookmarks)

## Installation

### From Source
1. Clone repository
2. Navigate to chrome://extensions/
3. Enable Developer mode
4. Click "Load unpacked"
5. Select the x-productivity-extension directory

### From Chrome Web Store
Available upon approval

## Configuration

### Main Settings (Popup)
- **Threshold**: Adjustable post limit
- **Mode**: Toggle between Nudge and Count
- **History**: Access via dedicated tab
- **View Psychology**: Open side panel for bookmark analyses

### Psychology Analyzer Settings (Options Page or Side Panel)
1. Get a Claude API key from [console.anthropic.com](https://console.anthropic.com)
2. Open extension options or click ⚙ in side panel
3. Enter your API key and click "Validate & Save"
4. Configure batch size (5-20 bookmarks)

## Usage

### Basic Usage Tracking
1. Browse X.com normally
2. View stats in extension popup
3. Monitor your daily usage against your threshold

### Bookmark Psychology Analysis
1. Configure your Claude API key (see Configuration above)
2. Bookmark tweets on X.com as usual
3. Extension automatically captures bookmarks
4. After 10 bookmarks (or 2 seconds), analysis runs automatically
5. Click "View Psychology" button in popup to see insights
6. Review persuasion techniques and cognitive biases in side panel

### Manual Processing
- Click ⚙ in side panel
- Click "Process Queue Now" to analyze current batch immediately

## Architecture

- JavaScript ES6+
- Chrome Extension Manifest V3
- SVG rendering
- chrome.storage.local API

## File Structure

```
manifest.json       Extension configuration (Manifest V3)
content.js          Tracking, DOM injection, and bookmark detection
background.js       Service worker for Claude API integration
popup.html          Main interface markup
popup.js            Stats processing and display
sidepanel.html      Psychology analysis interface
sidepanel.js        Analysis rendering and updates
sidepanel.css       Side panel styling
options.html        Settings page
options.js          Settings management and API validation
styles.css          Content script styling
icon16.png          16x16 icon
icon48.png          48x48 icon
icon128.png         128x128 icon
```

## Architecture

**Content Script** (`content.js`)
- Detects tweet views and bookmark actions
- Extracts tweet metadata (text, author, URL, media)
- Sends bookmark data to service worker

**Service Worker** (`background.js`)
- Manages bookmark queue (batch processing)
- Calls Claude API for psychological analysis
- Stores analyses in local storage
- Handles retry logic

**Side Panel** (`sidepanel.html/js/css`)
- Displays psychological analyses
- Real-time updates via storage events
- Settings management

**Options Page** (`options.html/js`)
- API key validation and storage
- Batch processing configuration
- Data management (clear bookmarks/analyses)

## Data Flow

```
User bookmarks tweet
  → Content script detects bookmark (MutationObserver on aria-label)
  → Extract tweet data (text, author, URL, timestamp)
  → Send to background.js
  → Add to queue
  → When 10 bookmarks OR 2s timeout
  → Call Claude API with batch
  → Parse JSON response (persuasion techniques, biases, patterns)
  → Store analysis in chrome.storage.local
  → Side panel updates automatically
```

## Privacy & Security

**Local Storage**: All usage tracking data stored locally in browser via chrome.storage.local

**API Key**: Stored unencrypted in local storage. Treat like a password. Never share.

**Data Transmission**: Bookmark content sent ONLY to Anthropic Claude API for analysis. No other external services.

**No Tracking**: No analytics, no telemetry, no user behavior tracking beyond local usage metrics.

**Open Source**: All code is visible and auditable.

## Testing

### Manual Testing Checklist

1. **Installation**
   - [ ] Load extension in Chrome
   - [ ] No console errors on load
   - [ ] Icons display correctly

2. **Basic Tracking**
   - [ ] Navigate to x.com
   - [ ] Verify post counters appear
   - [ ] Check popup shows accurate counts

3. **Bookmark Detection**
   - [ ] Bookmark a tweet with social proof language
   - [ ] Check browser console for "[Content] Bookmark detected" log
   - [ ] Verify bookmark stored (check chrome.storage in DevTools)

4. **API Configuration**
   - [ ] Open options page
   - [ ] Enter API key
   - [ ] Click "Validate & Save"
   - [ ] Verify success message

5. **Batch Processing**
   - [ ] Bookmark 10 tweets with varied content
   - [ ] Check console for "[Background] Processing batch" log
   - [ ] Verify API call succeeds

6. **Side Panel Display**
   - [ ] Open side panel via "View Psychology" button
   - [ ] Verify analyses display
   - [ ] Check persuasion techniques section
   - [ ] Check cognitive biases section
   - [ ] Verify overall patterns section
   - [ ] Click tweet links to verify they work

7. **Real-time Updates**
   - [ ] Keep side panel open
   - [ ] Bookmark more tweets
   - [ ] Verify side panel updates automatically

8. **Manual Processing**
   - [ ] Bookmark 3-5 tweets
   - [ ] Open side panel settings
   - [ ] Click "Process Queue Now"
   - [ ] Verify processing triggers

9. **Performance**
   - [ ] Browse X.com normally
   - [ ] Check for any slowdown
   - [ ] Monitor CPU/memory in Task Manager

10. **Edge Cases**
    - [ ] Bookmark tweet with no text (image only)
    - [ ] Bookmark retweet
    - [ ] Bookmark quote tweet
    - [ ] Test on both twitter.com and x.com

### Console Logging

**Content Script:**
```
[Content] Bookmark detected: {id, text, author, url...}
[Content] Bookmark psychology analyzer initialized
```

**Background Worker:**
```
[Background] Twitter Bookmark Psychology Analyzer initialized
[Background] New bookmark captured: {id, text...}
[Background] Queue size: 1/10
[Background] Processing batch of 10 bookmarks
[Background] Calling Claude API...
[Background] Claude API response: {...}
[Background] Analysis stored successfully
```

**Side Panel:**
```
[SidePanel] Storage changed, reloading analyses
```

## Troubleshooting

**Bookmarks not detected:**
- Check browser console for errors
- Verify MutationObserver is running
- X.com may have changed their DOM structure - check button selectors

**API calls failing:**
- Verify API key is correct (starts with `sk-ant-`)
- Check API key has sufficient credits
- Review Network tab for API response errors
- Check CORS/host permissions in manifest

**Side panel not updating:**
- Check storage change listeners
- Verify analyses are being stored
- Refresh side panel

**No analyses appearing:**
- Verify API key is configured
- Check batch actually processed
- Look for parsing errors in console

## API Costs

Claude API pricing (as of Feb 2025):
- Claude 3.5 Sonnet: ~$3 per million input tokens, ~$15 per million output tokens
- Average analysis: ~500 input tokens (10 tweets) + 500 output tokens
- Cost per batch: ~$0.01
- 100 batches (1000 bookmarks): ~$1

Configure batch size in options to control costs.

## Future Enhancements

- [ ] Bias tracking dashboard over time
- [ ] Persuasion technique frequency charts
- [ ] Counter-arguments generator
- [ ] Debiasing content suggestions
- [ ] Thread detection and analysis
- [ ] Multi-modal analysis (images/videos)
- [ ] Export psychological profile reports
- [ ] Educational mode with bias/technique explanations

## License

MIT

## Attribution

Visual design influenced by visualizevalue.com
