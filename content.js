// Track viewed posts
let viewedPosts = 0;
let threshold = 100;
let mode = 'nudge'; // 'nudge' or 'count'
let isBlocking = false;

// Track pixels scrolled
let pixelsScrolled = 0;
let lastScrollY = window.scrollY;

// Cache for VV posts
let vvPosts = [];
let vvPostsLoaded = false;

// Load saved state and check if 24hrs have passed
chrome.storage.local.get(['viewedPosts', 'pixelsScrolled', 'threshold', 'mode', 'vvPosts', 'lastResetTime', 'todayDate', 'history', 'hourlyData'], (result) => {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const storedDate = result.todayDate;

  // Check if it's a new day (but only if we have a previous date stored)
  if (storedDate && storedDate !== today) {
    // Save yesterday's data to history
    if (result.viewedPosts > 0 || result.pixelsScrolled > 0) {
      const history = result.history || [];
      const hourlyData = result.hourlyData || {};

      history.push({
        date: storedDate,
        tweets: result.viewedPosts || 0,
        pixels: result.pixelsScrolled || 0,
        hourly: hourlyData[storedDate] || {}
      });

      // Keep last 90 days
      const recentHistory = history.slice(-90);

      // Clean old hourly data
      const cleanHourlyData = {};
      recentHistory.forEach(day => {
        if (day.hourly) {
          cleanHourlyData[day.date] = day.hourly;
        }
      });

      chrome.storage.local.set({
        history: recentHistory,
        hourlyData: cleanHourlyData
      });
    }

    // Reset for new day
    viewedPosts = 0;
    pixelsScrolled = 0;
    chrome.storage.local.set({
      viewedPosts: 0,
      pixelsScrolled: 0,
      todayDate: today,
      lastResetTime: now
    });
    console.log('New day - counter reset');
  } else {
    // Same day or first load - restore existing counts
    viewedPosts = result.viewedPosts || 0;
    pixelsScrolled = result.pixelsScrolled || 0;

    // Set today's date if not set
    if (!storedDate) {
      chrome.storage.local.set({ todayDate: today });
    }
  }

  threshold = result.threshold || 100;
  mode = result.mode || 'nudge';

  if (result.vvPosts) {
    vvPosts = result.vvPosts;
    vvPostsLoaded = true;
  }

  checkAndUpdatePosts();
});

// Listen for setting updates from popup
chrome.storage.onChanged.addListener((changes) => {
  if (changes.threshold) {
    threshold = changes.threshold.newValue;
  }
  if (changes.mode) {
    mode = changes.mode.newValue;
  }
  if (changes.threshold || changes.mode) {
    // Reload page to apply new settings
    location.reload();
  }
});

// Track posts that have been counted and their numbers
const countedPosts = new Set();
const postNumbers = new Map(); // postId -> post number

// Fetch VV posts
async function fetchVVPosts() {
  if (vvPostsLoaded && vvPosts.length > 0) return;

  try {
    // Try to scrape from the current page if we're on VV's profile
    const isOnVVProfile = window.location.href.includes('visualizevalue');

    if (isOnVVProfile) {
      const tweets = document.querySelectorAll('article[data-testid="tweet"]');
      const posts = [];

      tweets.forEach(tweet => {
        const textEl = tweet.querySelector('[data-testid="tweetText"]');
        const imageEl = tweet.querySelector('[data-testid="tweetPhoto"] img');

        if (textEl || imageEl) {
          posts.push({
            text: textEl ? textEl.textContent : '',
            image: imageEl ? imageEl.src : null
          });
        }
      });

      if (posts.length > 0) {
        vvPosts = posts.slice(0, 50); // Store up to 50 posts
        chrome.storage.local.set({ vvPosts });
        vvPostsLoaded = true;
      }
    } else {
      // Use fallback VV-style messages if we can't fetch
      vvPosts = [
        { text: 'BUILD IN PUBLIC', image: null },
        { text: 'SHIP DAILY', image: null },
        { text: 'LEVERAGE YOURSELF', image: null },
        { text: 'VALUE > VOLUME', image: null },
        { text: 'FOCUS ON WHAT MATTERS', image: null },
        { text: 'TIME IS YOUR SCARCEST RESOURCE', image: null },
        { text: 'ASYMMETRIC UPSIDE', image: null },
        { text: 'PRODUCTIZE YOURSELF', image: null },
        { text: 'PERMISSIONLESS LEVERAGE', image: null },
        { text: 'COMPOUND YOUR EFFORTS', image: null }
      ];
      vvPostsLoaded = true;
    }
  } catch (error) {
    console.error('Failed to fetch VV posts:', error);
  }
}

// Initialize VV posts
fetchVVPosts();

// Observer to detect new posts
const observer = new MutationObserver(() => {
  checkAndUpdatePosts();
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

function checkAndUpdatePosts() {
  // Find all tweet articles
  const posts = document.querySelectorAll('article[data-testid="tweet"]');

  posts.forEach(post => {
    // Use a data attribute to track if we've counted this specific post
    if (post.hasAttribute('data-post-counted')) {
      // Already counted, just update counter if needed
      const postNumber = parseInt(post.getAttribute('data-post-number'));
      if (postNumber >= threshold && !post.hasAttribute('data-productivity-blocked')) {
        replaceTweetText(post, postNumber);
      }
      return;
    }

    // Check if post is at least partially in viewport
    if (isInViewport(post)) {
      // Mark as counted
      viewedPosts++;
      post.setAttribute('data-post-counted', 'true');
      post.setAttribute('data-post-number', viewedPosts.toString());

      // Track hourly and minute data
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hour = now.getHours().toString().padStart(2, '0');
      const minute = now.getMinutes().toString().padStart(2, '0');
      const minuteKey = `${today}T${hour}:${minute}`;

      chrome.storage.local.get(['hourlyData', 'minuteData', 'todayDate'], (result) => {
        const hourlyData = result.hourlyData || {};
        const minuteData = result.minuteData || {};

        // Track hourly
        if (!hourlyData[today]) hourlyData[today] = {};
        hourlyData[today][hour] = (hourlyData[today][hour] || 0) + 1;

        // Track per minute
        minuteData[minuteKey] = (minuteData[minuteKey] || 0) + 1;

        // Clean old minute data (keep only last 2 hours)
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        Object.keys(minuteData).forEach(key => {
          const keyDate = new Date(key.replace('T', ' '));
          if (keyDate.getTime() < twoHoursAgo) {
            delete minuteData[key];
          }
        });

        // Save count and update reset time if this is the first post
        const saveData = { viewedPosts, hourlyData, minuteData };
        if (viewedPosts === 1) {
          saveData.lastResetTime = Date.now();
          saveData.todayDate = today;
        }
        chrome.storage.local.set(saveData);
      });

      console.log(`Posts viewed: ${viewedPosts}/${threshold}`);

      // Always add counter to viewed posts
      replaceTweetText(post, viewedPosts);
    }
  });

  isBlocking = viewedPosts >= threshold;
}

function getPostId(post) {
  // Use the post's position in DOM as a unique identifier
  const link = post.querySelector('a[href*="/status/"]');
  return link ? link.href : post.innerHTML.substring(0, 100);
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const buffer = 1000; // Load tweets 1000px before they enter viewport

  // Check if element is in viewport or within buffer zone below
  return (
    rect.top < windowHeight + buffer && // Top is within buffer zone
    rect.bottom > -buffer // Bottom hasn't scrolled too far past
  );
}

function replaceTweetText(post, postNumber) {
  if (post.hasAttribute('data-productivity-blocked')) return;

  post.setAttribute('data-productivity-blocked', 'true');

  let color, statusText;

  if (mode === 'count') {
    // Count mode: simple grey
    color = '#666666';
    statusText = `Post #${postNumber}`;
  } else {
    // Nudge mode: green to red spectrum based on progress to limit
    const progress = postNumber / threshold;

    if (progress <= 1) {
      // Green (120) to Red (0) via Yellow (60)
      const hue = 120 - (progress * 120); // 120 -> 0
      color = `hsl(${hue}, 100%, 35%)`;
      statusText = `${Math.round(progress * 100)}% of limit`;
    } else {
      // Past limit: stay red
      color = '#cc0000';
      statusText = `${Math.round((progress - 1) * 100)}% over limit!`;
    }
  }

  // Find timestamp element to insert counter after
  const timestamp = post.querySelector('time');
  if (timestamp && timestamp.parentElement) {
    const counter = document.createElement('span');
    counter.className = 'productivity-counter';
    counter.style.borderColor = color;
    counter.style.color = color;
    counter.textContent = postNumber.toString();
    counter.title = statusText;

    // Insert after timestamp's parent
    timestamp.parentElement.parentElement.appendChild(counter);
  }
}

function resetCounter() {
  viewedPosts = 0;
  countedPosts.clear();
  postNumbers.clear();
  chrome.storage.local.set({ viewedPosts: 0, lastResetTime: Date.now() });
  location.reload();
}

// Check posts on scroll and track pixels
let scrollTimeout;
window.addEventListener('scroll', () => {
  // Track pixels scrolled
  const currentScrollY = window.scrollY;
  const scrollDelta = Math.abs(currentScrollY - lastScrollY);

  if (scrollDelta > 0) {
    pixelsScrolled += scrollDelta;
    lastScrollY = currentScrollY;

    // Save periodically (every 1000px to avoid excessive writes)
    if (pixelsScrolled % 1000 < scrollDelta) {
      chrome.storage.local.set({ pixelsScrolled });
    }
  }

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(checkAndUpdatePosts, 100);
});

// Initial check
checkAndUpdatePosts();
