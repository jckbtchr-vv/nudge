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
      loadComparisonStats();
      loadDailyChart();
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

// Load comparison stats
function loadComparisonStats() {
  chrome.storage.local.get(['history', 'viewedPosts'], (result) => {
    const history = result.history || [];
    const todayCount = result.viewedPosts || 0;

    if (history.length === 0) {
      document.getElementById('dailyComparison').innerHTML = '-';
      document.getElementById('weeklyAverage').innerHTML = '-';
      document.getElementById('monthlyAverage').innerHTML = '-';
      return;
    }

    // Today vs Yesterday
    const yesterday = history[history.length - 1];
    if (yesterday) {
      const diff = todayCount - yesterday.tweets;
      const diffPercent = yesterday.tweets > 0 ? ((diff / yesterday.tweets) * 100).toFixed(0) : 0;
      const deltaClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
      const deltaSign = diff > 0 ? '+' : '';

      document.getElementById('dailyComparison').innerHTML = `
        ${todayCount}
        <span class="delta ${deltaClass}">${deltaSign}${diffPercent}%</span>
      `;
    }

    // 7-Day Average
    const last7Days = history.slice(-7);
    const avg7 = last7Days.length > 0
      ? Math.round(last7Days.reduce((sum, day) => sum + day.tweets, 0) / last7Days.length)
      : 0;
    const diff7 = todayCount - avg7;
    const deltaClass7 = diff7 > 0 ? 'positive' : diff7 < 0 ? 'negative' : '';
    const deltaSign7 = diff7 > 0 ? '+' : '';

    document.getElementById('weeklyAverage').innerHTML = `
      ${avg7}
      <span class="delta ${deltaClass7}">${deltaSign7}${diff7}</span>
    `;

    // 30-Day Average
    const last30Days = history.slice(-30);
    const avg30 = last30Days.length > 0
      ? Math.round(last30Days.reduce((sum, day) => sum + day.tweets, 0) / last30Days.length)
      : 0;
    const diff30 = todayCount - avg30;
    const deltaClass30 = diff30 > 0 ? 'positive' : diff30 < 0 ? 'negative' : '';
    const deltaSign30 = diff30 > 0 ? '+' : '';

    document.getElementById('monthlyAverage').innerHTML = `
      ${avg30}
      <span class="delta ${deltaClass30}">${deltaSign30}${diff30}</span>
    `;
  });
}

// Load 30-day trend chart
function loadDailyChart() {
  chrome.storage.local.get(['history', 'viewedPosts'], (result) => {
    const history = result.history || [];
    const todayCount = result.viewedPosts || 0;

    // Get last 30 days including today
    const last30Days = history.slice(-30);
    const allDays = [...last30Days, { date: new Date().toISOString().split('T')[0], tweets: todayCount }];

    if (allDays.length === 0) {
      document.getElementById('dailyChart').innerHTML = '<div class="empty-history">NO DATA YET</div>';
      return;
    }

    const maxTweets = Math.max(...allDays.map(d => d.tweets), 1);
    const today = new Date().toISOString().split('T')[0];

    const chartHtml = allDays.map(day => {
      const height = (day.tweets / maxTweets) * 100;
      const isToday = day.date === today;
      const dayOfWeek = new Date(day.date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dateLabel = new Date(day.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return `
        <div class="daily-bar-wrapper">
          <div class="daily-bar ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}"
               style="height: ${height}%"
               title="${dateLabel}: ${day.tweets} tweets"></div>
        </div>
      `;
    }).join('');

    document.getElementById('dailyChart').innerHTML = chartHtml;
  });
}

// Load heat map calendar (last 4 weeks)
function loadHeatmap() {
  chrome.storage.local.get(['history', 'viewedPosts'], (result) => {
    const history = result.history || [];
    const todayCount = result.viewedPosts || 0;

    // Get last 28 days (4 weeks) including today
    const last28Days = history.slice(-27);
    const allDays = [...last28Days, { date: new Date().toISOString().split('T')[0], tweets: todayCount }];

    // Pad to 28 days if needed
    while (allDays.length < 28) {
      allDays.unshift({ date: '', tweets: 0 });
    }

    // Calculate max for intensity
    const maxTweets = Math.max(...allDays.map(d => d.tweets), 1);

    const heatmapHtml = allDays.map((day, index) => {
      const intensity = day.tweets > 0 ? Math.min(5, Math.ceil((day.tweets / maxTweets) * 5)) : 0;

      if (!day.date) {
        return '<div class="heatmap-day" style="opacity: 0.3;"></div>';
      }

      const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
      const dayNum = new Date(day.date).getDate();
      const dateLabel = new Date(day.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return `
        <div class="heatmap-day intensity-${intensity}" title="${dateLabel}: ${day.tweets} tweets">
          <div class="heatmap-day-label">${dayOfWeek}</div>
          <div class="heatmap-day-value">${dayNum}</div>
        </div>
      `;
    }).join('');

    document.getElementById('heatmapChart').innerHTML = heatmapHtml;
  });
}

// Generate sparkline SVG for last 7 days
function generateSparkline(history, currentIndex) {
  const data = [];

  // Get 7 days of data leading up to current day
  for (let i = 6; i >= 0; i--) {
    const index = currentIndex - i;
    data.push(index >= 0 ? history[index].tweets : 0);
  }

  const max = Math.max(...data, 1);
  const width = 60;
  const height = 20;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value / max) * height);
    return { x, y, value };
  });

  const path = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  const lastPoint = points[points.length - 1];

  return `
    <svg viewBox="0 0 ${width} ${height}">
      <path d="${path}" class="sparkline-path"/>
      <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="1.5" class="sparkline-dot"/>
    </svg>
  `;
}

// Load enhanced history
function loadHistory() {
  loadMinuteChart();
  loadHourlyChart();
  loadComparisonStats();
  loadDailyChart();
  loadHeatmap();

  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || [];
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">NO HISTORY YET</div>';
      return;
    }

    // Show most recent first
    const recentHistory = history.slice().reverse();

    historyList.innerHTML = recentHistory.map((day, reverseIndex) => {
      const originalIndex = history.length - 1 - reverseIndex;

      const date = new Date(day.date);
      const dateFormatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      const pixelsFormatted = day.pixels >= 1000
        ? (day.pixels / 1000).toFixed(1) + 'k'
        : day.pixels;

      // Calculate deltas
      let tweetsDelta = '';
      let pixelsDelta = '';

      if (originalIndex > 0) {
        const prevDay = history[originalIndex - 1];
        const tweetsDiff = day.tweets - prevDay.tweets;
        const pixelsDiff = day.pixels - prevDay.pixels;

        if (tweetsDiff !== 0) {
          const tweetsDeltaClass = tweetsDiff > 0 ? 'positive' : 'negative';
          const tweetsDeltaSign = tweetsDiff > 0 ? '+' : '';
          tweetsDelta = `<span class="history-delta ${tweetsDeltaClass}">${tweetsDeltaSign}${tweetsDiff}</span>`;
        }

        if (pixelsDiff !== 0) {
          const pixelsDeltaClass = pixelsDiff > 0 ? 'positive' : 'negative';
          const pixelsDeltaSign = pixelsDiff > 0 ? '+' : '';
          const pixelsDiffFormatted = Math.abs(pixelsDiff) >= 1000
            ? (pixelsDiff / 1000).toFixed(1) + 'k'
            : pixelsDiff;
          pixelsDelta = `<span class="history-delta ${pixelsDeltaClass}">${pixelsDeltaSign}${pixelsDiffFormatted}</span>`;
        }
      }

      // Generate sparkline
      const sparkline = originalIndex >= 6 ? generateSparkline(history, originalIndex) : '';

      return `
        <div class="history-item">
          <div class="history-item-header">
            <div>
              <span class="history-date">${dateFormatted}</span>
              <span class="history-day-name">${dayName}</span>
            </div>
          </div>
          <div class="history-metrics">
            <div class="history-metric">
              <div class="history-metric-label">Posts Read</div>
              <div class="history-metric-value">
                ${day.tweets}
                ${tweetsDelta}
              </div>
            </div>
            <div class="history-metric">
              <div class="history-metric-label">PX Scrolled</div>
              <div class="history-metric-value">
                ${pixelsFormatted}
                ${pixelsDelta}
              </div>
            </div>
          </div>
          ${sparkline ? `<div class="history-sparkline">${sparkline}</div>` : ''}
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

