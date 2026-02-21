// Auto-update interval for charts
let chartUpdateInterval = null;
let isHistoryView = false;

// View toggle
document.getElementById('historyToggle').addEventListener('click', () => {
  isHistoryView = !isHistoryView;

  if (isHistoryView) {
    // Show history
    document.getElementById('statsTab').classList.remove('active');
    document.getElementById('historyTab').classList.add('active');
    document.getElementById('historyToggle').textContent = 'Stats';

    // Load and auto-update history
    loadHistory();
    chartUpdateInterval = setInterval(() => {
      loadMinuteChart();
      loadHourlyChart();
    }, 5000);
  } else {
    // Show stats
    document.getElementById('statsTab').classList.add('active');
    document.getElementById('historyTab').classList.remove('active');
    document.getElementById('historyToggle').textContent = 'History';

    // Clear interval
    if (chartUpdateInterval) {
      clearInterval(chartUpdateInterval);
      chartUpdateInterval = null;
    }
  }
});

// Load current stats
function loadStats() {
  chrome.storage.local.get(['viewedPosts', 'pixelsScrolled', 'threshold', 'mode'], (result) => {
    console.log('Loading stats:', result);
    document.getElementById('viewedCount').textContent = result.viewedPosts || 0;

    // Format pixels (e.g., 1234 -> 1.2k)
    const pixels = result.pixelsScrolled || 0;
    const pixelsFormatted = pixels >= 1000
      ? (pixels / 1000).toFixed(1) + 'k'
      : pixels.toString();
    document.getElementById('pixelsCount').textContent = pixelsFormatted;

    // Only update threshold if input is not focused (prevents overwriting while typing)
    const thresholdInput = document.getElementById('threshold');
    if (document.activeElement !== thresholdInput) {
      thresholdInput.value = result.threshold || 100;
    }

    // Update mode buttons
    const currentMode = result.mode || 'nudge';
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === currentMode);
    });
  });
}

// Load minute chart (last 60 minutes) - line graph
function loadMinuteChart() {
  chrome.storage.local.get(['minuteData'], (result) => {
    const minuteData = result.minuteData || {};
    const now = new Date();
    const data = [];

    // Generate last 60 minutes
    for (let i = 59; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 60 * 1000));
      const today = time.toISOString().split('T')[0];
      const hour = time.getHours().toString().padStart(2, '0');
      const minute = time.getMinutes().toString().padStart(2, '0');
      const key = `${today}T${hour}:${minute}`;

      const count = minuteData[key] || 0;
      data.push(count);
    }

    // Create SVG line graph
    const width = 288; // Adjust based on container
    const height = 60;
    const maxCount = Math.max(...data, 1);
    const padding = 2;

    // Calculate points for the line
    const points = data.map((count, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((count / maxCount) * (height - padding * 2)) - padding;
      return { x, y, count };
    });

    // Create SVG path
    const linePath = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    // Create filled area path
    const fillPath = `M 0 ${height} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${width} ${height} Z`;

    // Create dots
    const dots = points
      .map((p, i) => p.count > 0 ? `<circle cx="${p.x}" cy="${p.y}" r="2" class="line-dot"><title>${p.count} tweets</title></circle>` : '')
      .join('');

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <path d="${fillPath}" class="line-fill"/>
        <path d="${linePath}" class="line-path" vector-effect="non-scaling-stroke"/>
        <g class="line-dots">${dots}</g>
      </svg>
    `;

    document.getElementById('minuteChart').innerHTML = svg;
  });
}

// Load hourly chart
function loadHourlyChart() {
  chrome.storage.local.get(['hourlyData', 'todayDate'], (result) => {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const hourlyData = result.hourlyData || {};
    const todayData = hourlyData[today] || {};

    // Find first hour with data
    let firstHour = 0;
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      if (todayData[hour] > 0) {
        firstHour = h;
        break;
      }
    }

    const maxTweets = Math.max(...Object.values(todayData), 1);
    const chartHtml = [];

    // Only show hours from first data to current hour
    for (let h = firstHour; h <= currentHour; h++) {
      const hour = h.toString().padStart(2, '0');
      const count = todayData[hour] || 0;
      const height = maxTweets > 0 ? (count / maxTweets) * 100 : 0;
      const isActive = h === currentHour;

      chartHtml.push(`
        <div class="hourly-bar-wrapper">
          <div class="hourly-bar ${isActive ? 'active' : ''}" style="height: ${height}%" title="${hour}:00 - ${count} tweets"></div>
        </div>
      `);
    }

    document.getElementById('hourlyChart').innerHTML = chartHtml.join('');
  });
}

// Load history
function loadHistory() {
  loadMinuteChart();
  loadHourlyChart();

  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || [];
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">NO HISTORY YET</div>';
      return;
    }

    // Show most recent first
    const recentHistory = history.slice().reverse();

    historyList.innerHTML = recentHistory.map(day => {
      const date = new Date(day.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      const pixelsFormatted = day.pixels >= 1000
        ? (day.pixels / 1000).toFixed(1) + 'k'
        : day.pixels;

      return `
        <div class="history-item">
          <div class="history-date">${date}</div>
          <div class="history-stats">
            <span>${day.tweets} tweets</span>
            <span>${pixelsFormatted} px</span>
          </div>
        </div>
      `;
    }).join('');
  });
}

// Mode button handlers
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;

    // Update active state
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Save and reload X tabs
    chrome.storage.local.set({ mode }, () => {
      chrome.tabs.query({ url: ['https://twitter.com/*', 'https://x.com/*'] }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const threshold = parseInt(document.getElementById('threshold').value);
  const activeMode = document.querySelector('.mode-btn.active').dataset.mode;

  chrome.storage.local.set({ threshold, mode: activeMode }, () => {
    const status = document.getElementById('status');
    status.textContent = 'SETTINGS SAVED!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});

// Load stats on popup open
loadStats();

// Update stats every second while popup is open
setInterval(loadStats, 1000);

