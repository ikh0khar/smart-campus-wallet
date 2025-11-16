// API Configuration
// Netlify-ready: Automatically detects deployment and uses correct backend URL
const API_BASE_URL = (() => {
    // For local development, use localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    
    // Priority 1: Use config.js file (for Netlify - set your backend URL here)
    // Create public/config.js with: window.APP_CONFIG = { API_BASE_URL: 'https://your-backend.railway.app/api' }
    if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
        return window.APP_CONFIG.API_BASE_URL;
    }
    
    // Priority 2: Use global variable set in HTML (for Netlify environment variables)
    // Netlify can inject this at build time or via _headers/_redirects
    if (window.API_BACKEND_URL) {
        return window.API_BACKEND_URL;
    }
    
    // Priority 3: Check for Netlify environment variable pattern
    // Netlify sets these, but they're only available at build time for static sites
    // So we use config.js instead
    
    // Priority 4: Same-domain deployment (Railway/Render full-stack)
    // If frontend and backend are on same domain, use relative URL
    return window.location.origin + '/api';
})();

// Log API URL for debugging (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('API Base URL:', API_BASE_URL);
}

// Helper function to safely parse JSON response
async function safeJsonParse(response) {
    try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (!text || text.trim() === '') {
                return { success: false, message: 'Empty response from server' };
            }
            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', text.substring(0, 200));
                return { success: false, message: 'Invalid JSON response from server', rawText: text.substring(0, 200) };
            }
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            return { success: false, message: `Server returned ${contentType || 'unknown content type'} instead of JSON`, rawText: text.substring(0, 200) };
        }
    } catch (error) {
        console.error('Error reading response:', error);
        return { success: false, message: error.message || 'Error reading server response' };
    }
}

// Menu toggle functionality - only run if not already initialized
if (!window.menuInitialized) {
document.addEventListener('DOMContentLoaded', function() {
        // Only run if elements exist and haven't been initialized
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
        
        if (menuToggle && !menuToggle.dataset.initialized) {
            menuToggle.dataset.initialized = 'true';
    
    function toggleMenu() {
                if (sideMenu) {
        sideMenu.classList.toggle('open');
                }
                if (menuOverlay) {
        menuOverlay.classList.toggle('active');
                }
                if (menuToggle) {
        menuToggle.classList.toggle('active');
    }
            }
            
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu();
            });
    
    if (menuOverlay) {
                menuOverlay.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu();
                });
    }
    
    // Close menu when clicking on menu items
    const menuItems = document.querySelectorAll('.side-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            setTimeout(toggleMenu, 300); // Small delay for smooth transition
        });
    });
        }

        // Initialize API calls when navigating to sections
        initializeAPIIntegration();
    });
    
    window.menuInitialized = true;
}

// API Integration Functions
async function initializeAPIIntegration() {
    // Test API connection
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await safeJsonParse(response);
        if (data.message) {
            console.log('✅ API Connected:', data.message);
        }
    } catch (error) {
        console.error('❌ API Connection Error:', error);
    }

    // Load data when sections are visible (only if sections exist on current page)
    // Only load budgeting data if we're on the budgeting page
    if (window.location.pathname === '/budgeting.html' || window.location.pathname === '/budgeting.html') {
        loadBudgetingData();
    }
    
    // Only load rewards if on rewards page
    if (window.location.pathname === '/rewards.html') {
        loadRewardsData();
    }
    
    // Only load activity data if on activity page
    if (window.location.pathname === '/activity.html') {
        loadActivityData();
    }
}

// Budgeting and Spending API Integration
async function loadBudgetingData() {
    const contentDiv = document.getElementById('budgeting-content');
    if (!contentDiv) return;

    try {
        // Use first available user from dataset (U001, U002, etc.) or default
        const defaultUserId = 'U001'; // Changed from user123 to match CSV data
        
        // Fetch transactions summary
        const summaryResponse = await fetch(`${API_BASE_URL}/transactions/summary?userId=${defaultUserId}`);
        const summaryData = await safeJsonParse(summaryResponse);
        
        // Fetch transactions - get latest first for the user
        const transactionsResponse = await fetch(`${API_BASE_URL}/transactions?userId=${defaultUserId}&sortBy=date&sortOrder=desc`);
        const transactionsData = await safeJsonParse(transactionsResponse);
        
        // Fetch category breakdown
        const categoriesResponse = await fetch(`${API_BASE_URL}/transactions/categories?userId=${defaultUserId}`);
        const categoriesData = await safeJsonParse(categoriesResponse);
        
        // Fetch trends data for line chart
        const trendsResponse = await fetch(`${API_BASE_URL}/transactions/trends?period=monthly&userId=${defaultUserId}`);
        const trendsData = await safeJsonParse(trendsResponse);
        
        if (summaryData.success && transactionsData.success && categoriesData.success) {
            let html = '<div class="budget-dashboard">';
            
            // Summary cards
            html += '<div class="summary-cards">';
            html += `<div class="summary-card"><h3>Total Spent</h3><p class="amount">$${summaryData.data.total.toFixed(2)}</p></div>`;
            html += `<div class="summary-card"><h3>Transactions</h3><p class="amount">${summaryData.data.count}</p></div>`;
            html += `<div class="summary-card"><h3>Average</h3><p class="amount">$${summaryData.data.average.toFixed(2)}</p></div>`;
            html += `<div class="summary-card"><h3>Daily Average</h3><p class="amount">$${summaryData.data.dailyAverage.toFixed(2)}</p></div>`;
            html += '</div>';
            
            // Charts section
            html += '<div class="charts-section">';
            
            // Pie Chart - Spending by Category
            if (categoriesData.data && categoriesData.data.length > 0) {
                html += '<div class="chart-container"><h3>Spending by Category</h3><canvas id="categoryPieChart"></canvas></div>';
            }
            
            // Line Chart - Spending Trends
            if (trendsData.success && trendsData.data && trendsData.data.length > 0) {
                html += '<div class="chart-container"><h3>Monthly Spending Trends</h3><canvas id="trendsLineChart"></canvas></div>';
            }
            
            html += '</div>';
            
            // Category breakdown list
            if (categoriesData.data && categoriesData.data.length > 0) {
                html += '<div class="category-breakdown"><h3>Category Details</h3><ul class="category-list">';
                categoriesData.data.forEach(cat => {
                    html += `<li><span class="category-name">${cat.category}</span> <span class="category-amount">$${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)</span></li>`;
                });
                html += '</ul></div>';
            }
            
            // Recent transactions - show latest first
            if (transactionsData.data && transactionsData.data.length > 0) {
                html += '<div class="recent-transactions"><h3>Recent Transactions</h3><ul class="transaction-list">';
                // Sort by date descending (newest first) and take top 10
                const sortedTransactions = [...transactionsData.data].sort((a, b) => {
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);
                    return dateB - dateA; // Descending (newest first)
                });
                sortedTransactions.slice(0, 10).forEach(tx => {
                    const date = tx.date ? new Date(tx.date).toLocaleDateString() : '';
                    html += `<li>
                        <div class="tx-info">
                            <span class="tx-desc">${tx.description || tx.merchant || 'Transaction'}</span>
                            <span class="tx-date">${date}</span>
                        </div>
                        <div class="tx-details">
                            <span class="tx-category">${tx.category || 'other'}</span>
                            <span class="tx-amount">$${parseFloat(tx.amount || 0).toFixed(2)}</span>
                        </div>
                    </li>`;
                });
                html += '</ul></div>';
            }
            
            html += '</div>';
            contentDiv.innerHTML = html;
            
            // Create charts after HTML is inserted
            if (categoriesData.data && categoriesData.data.length > 0) {
                createCategoryPieChart(categoriesData.data);
            }
            
            if (trendsData.success && trendsData.data && trendsData.data.length > 0) {
                createTrendsLineChart(trendsData.data);
            }
            
            console.log('✅ Budgeting data loaded and displayed with charts');
        }
    } catch (error) {
        console.error('❌ Budgeting API Error:', error);
        contentDiv.innerHTML = `<div class="error">Error loading budgeting data: ${error.message}</div>`;
    }
}

// Create Pie Chart for Spending by Category
function createCategoryPieChart(categoryData) {
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;
    
    // Color palette
    const colors = [
        '#bd3346', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
        '#00BCD4', '#FFC107', '#795548', '#607D8B', '#E91E63'
    ];
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoryData.map(cat => cat.category.charAt(0).toUpperCase() + cat.category.slice(1)),
            datasets: [{
                label: 'Spending',
                data: categoryData.map(cat => cat.amount),
                backgroundColor: colors.slice(0, categoryData.length),
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#fff',
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#bd3346',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = '$' + context.parsed.toFixed(2);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1) + '%';
                            return label + ': ' + value + ' (' + percentage + ')';
                        }
                    }
                }
            }
        }
    });
}

// Create Line Chart for Spending Trends
function createTrendsLineChart(trendsData) {
    const ctx = document.getElementById('trendsLineChart');
    if (!ctx) return;
    
    // Sort by date
    const sortedData = [...trendsData].sort((a, b) => a.date.localeCompare(b.date));
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(item => {
                // Format date for display
                const dateParts = item.date.split('-');
                if (dateParts.length === 2) {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return monthNames[parseInt(dateParts[1]) - 1] + ' ' + dateParts[0];
                }
                return item.date;
            }),
            datasets: [{
                label: 'Spending',
                data: sortedData.map(item => item.amount),
                borderColor: '#bd3346',
                backgroundColor: 'rgba(189, 51, 70, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#bd3346',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#bd3346',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return 'Spending: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#ccc',
                        font: {
                            size: 11,
                            family: "'Inter', sans-serif"
                        },
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#ccc',
                        font: {
                            size: 11,
                            family: "'Inter', sans-serif"
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Global variables for activity page
let allEvents = [];
let defaultUserId = 'U001'; // Changed from user123 to match CSV data
let currentEventFilter = 'all';
let currentCategoryFilter = 'all';

// Activity API Integration
async function loadActivityData() {
    const contentDiv = document.getElementById('activity-content');
    if (!contentDiv) return;

    try {
        // Fetch all events with user attendance status
        const eventsResponse = await fetch(`${API_BASE_URL}/activities/events?userId=${defaultUserId}`);
        const eventsData = await safeJsonParse(eventsResponse);
        
        // Fetch activity summary
        const summaryResponse = await fetch(`${API_BASE_URL}/activities/summary/${defaultUserId}`);
        const summaryData = await safeJsonParse(summaryResponse);
        
        if (eventsData.success) {
            // Store all events globally
            allEvents = eventsData.data || [];
            
            // Store summaryData globally
            window.summaryData = summaryData;
            
            // Display events with current filter
            displayEvents(allEvents, summaryData);
            
            console.log('✅ Activity data loaded and displayed');
        } else {
            contentDiv.innerHTML = '<div class="no-data">No events available.</div>';
        }
    } catch (error) {
        console.error('❌ Activity API Error:', error);
        contentDiv.innerHTML = `<div class="error">Error loading activity data: ${error.message}</div>`;
    }
}

// Display events based on filter
function displayEvents(events, summaryData) {
    const contentDiv = document.getElementById('activity-content');
    if (!contentDiv) return;
    
    // Get current filters
    const activeFilter = document.querySelector('.filter-btn[data-filter].active');
    const activeCategory = document.querySelector('.category-btn.active');
    const filter = activeFilter ? activeFilter.dataset.filter : currentEventFilter;
    const category = activeCategory ? activeCategory.dataset.category : currentCategoryFilter;
    
    // Store current filters
    currentEventFilter = filter;
    currentCategoryFilter = category;
    
    // Filter events by type (free/paid/my/all)
    let filteredEvents = events;
    if (filter === 'free') {
        filteredEvents = events.filter(e => e.isFree === true);
    } else if (filter === 'paid') {
        filteredEvents = events.filter(e => e.isFree === false);
    } else if (filter === 'my') {
        filteredEvents = events.filter(e => e.isAttending === true);
    }
    
    // Filter by category
    if (category && category !== 'all') {
        filteredEvents = filteredEvents.filter(e => e.category === category);
    }
    
    let html = '<div class="activity-dashboard">';
    
    // Campus Events Section
    html += '<div class="events-section">';
    html += `<h3 class="section-subtitle">Campus Events <span class="event-count">(${filteredEvents.length})</span></h3>`;
    
    if (filteredEvents.length > 0) {
        html += '<div class="events-grid">';
        filteredEvents.forEach(event => {
            const eventDate = event.startTime ? new Date(event.startTime).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            }) : 'Date TBD';
            const eventTime = event.startTime ? new Date(event.startTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            }) : '';
            
            const isAttending = event.isAttending || false;
            const costDisplay = event.isFree ? '<span class="event-badge free">FREE</span>' : `<span class="event-badge paid">$${event.cost || '0'}</span>`;
            const attendingBadge = isAttending ? '<span class="attending-badge">✓ Attending</span>' : '';
            
            html += `<div class="event-card ${isAttending ? 'attending' : ''}">
                <div class="event-header">
                    <h4 class="event-name">${event.name || 'Event'}</h4>
                    ${costDisplay}
                </div>
                <div class="event-details">
                    <div class="event-detail-item">
                        <span class="event-icon">📅</span>
                        <span>${eventDate} ${eventTime}</span>
                    </div>
                    ${event.location ? `<div class="event-detail-item">
                        <span class="event-icon">📍</span>
                        <span>${event.location}</span>
                    </div>` : ''}
                    ${event.category ? `<div class="event-detail-item">
                        <span class="event-icon">🏷️</span>
                        <span>${event.category}</span>
                    </div>` : ''}
                </div>
                <div class="event-footer">
                    ${attendingBadge}
                    <button class="btn-attend ${isAttending ? 'btn-unattend' : 'btn-join'}" onclick="toggleAttendance('${event.eventId}', ${isAttending})" data-event-id="${event.eventId}" data-is-attending="${isAttending}">
                        ${isAttending ? 'Cancel Attendance' : 'Mark Attending'}
                    </button>
                </div>
            </div>`;
        });
        html += '</div>';
    } else {
        html += '<div class="no-events">No events found for this filter.</div>';
    }
    html += '</div>';
    
    // Activity Stats Section (My Activity Summary)
    if (summaryData && summaryData.success) {
        html += displayActivityStatsSection(summaryData);
        
        // Update status messages with current data
        updateStatusFromData(summaryData);
    }
    
    html += '</div>';
    contentDiv.innerHTML = html;
}

// Update status messages from summary data
function updateStatusFromData(summaryData) {
    // Update events status
    const eventsAttended = summaryData.data?.events?.totalAttended || 0;
    const eventsStatusEl = document.getElementById('events-status');
    if (eventsStatusEl) {
        eventsStatusEl.textContent = `${eventsAttended} events attended - Earn points!`;
        eventsStatusEl.style.color = '#FFD700';
    }
    
    // Update class attendance status
    const classAttendance = summaryData.data?.classAttendance;
    if (classAttendance) {
        const classStatusEl = document.getElementById('class-status');
        if (classStatusEl) {
            const today = new Date().toISOString().split('T')[0];
            const attendedToday = classAttendance.dates?.includes(today);
            if (attendedToday) {
                classStatusEl.textContent = `✓ Logged today! ${classAttendance.attendedDays}/${classAttendance.totalDays} days (${classAttendance.percentage.toFixed(0)}%)`;
                classStatusEl.style.color = '#4CAF50';
            } else {
                classStatusEl.textContent = `Not logged today | ${classAttendance.attendedDays}/${classAttendance.totalDays} days`;
                classStatusEl.style.color = '#888';
            }
        }
    }
    
    // Update physical activity status
    const activities = summaryData.data?.activities;
    if (activities && activities.total > 0) {
        const activityStatusEl = document.getElementById('activity-status');
        if (activityStatusEl) {
            activityStatusEl.textContent = `${activities.total} activities logged - Keep it up!`;
            activityStatusEl.style.color = '#4CAF50';
        }
    }
}

// Display activity statistics
function displayActivityStats(summaryData) {
    // This is called from loadActivityData, stats are included in displayEvents
}

// Display activity stats section
function displayActivityStatsSection(summaryData) {
    let html = '<div class="activity-stats-section">';
    html += '<h3 class="section-subtitle">My Activity Summary</h3>';
    html += '<div class="stats-grid">';
    
    // Events Attended
    const eventsAttended = summaryData.data?.events?.totalAttended || 0;
    html += `<div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
            <div class="stat-value">${eventsAttended}</div>
            <div class="stat-label">Events Attended</div>
        </div>
    </div>`;
    
    // Class Attendance
    const classAttendance = summaryData.data?.classAttendance;
    if (classAttendance) {
        const percentage = classAttendance.percentage || 0;
        html += `<div class="stat-card">
            <div class="stat-icon">🎓</div>
            <div class="stat-content">
                <div class="stat-value">${percentage.toFixed(0)}%</div>
                <div class="stat-label">Class Attendance</div>
                <div class="stat-sublabel">${classAttendance.attendedDays || 0} / ${classAttendance.totalDays || 0} days</div>
            </div>
        </div>`;
    }
    
    // Physical Activities
    const activities = summaryData.data?.activities;
    if (activities && activities.total > 0) {
        html += `<div class="stat-card">
            <div class="stat-icon">💪</div>
            <div class="stat-content">
                <div class="stat-value">${activities.total}</div>
                <div class="stat-label">Physical Activities</div>
                <div class="stat-sublabel">Gym: ${activities.gym?.count || 0} | Sports: ${activities.sports?.count || 0}</div>
            </div>
        </div>`;
    }
    
    html += '</div></div>';
    return html;
}

// Filter events by type (all/free/paid/my)
function filterEvents(filter) {
    // Update active button (only for event type filters, not category)
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.classList.remove('active');
    });
    const filterBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (filterBtn) {
        filterBtn.classList.add('active');
    }
    
    // Re-display events with new filter
    if (window.summaryData) {
        displayEvents(allEvents, window.summaryData);
    } else {
        loadActivityData();
    }
}

// Filter events by category
function filterByCategory(category) {
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const categoryBtn = document.querySelector(`[data-category="${category}"]`);
    if (categoryBtn) {
        categoryBtn.classList.add('active');
    }
    
    // Re-display events with new category filter
    if (window.summaryData) {
        displayEvents(allEvents, window.summaryData);
    } else {
        loadActivityData();
    }
}

// Toggle event attendance
async function toggleAttendance(eventId, currentlyAttending) {
    try {
        const userId = defaultUserId;
        
        // Update button state immediately for better UX
        const button = document.querySelector(`[data-event-id="${eventId}"]`);
        if (button) {
            button.disabled = true;
            button.textContent = 'Processing...';
        }
        
        if (currentlyAttending) {
            // Remove attendance
            const response = await fetch(`${API_BASE_URL}/activities/events/${eventId}/attend`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });
            
            const data = await safeJsonParse(response);
            if (data.success) {
                updateEventsStatus('✓ Event attendance removed');
                // Update the event in allEvents immediately
                const event = allEvents.find(e => e.eventId === eventId);
                if (event) {
                    event.isAttending = false;
                }
                // Force immediate UI update before reload
                const eventCards = document.querySelectorAll('.event-card');
                eventCards.forEach(card => {
                    const button = card.querySelector('.btn-attend');
                    if (button && button.onclick && button.onclick.toString().includes(eventId)) {
                        const eventName = card.querySelector('.event-name');
                        if (eventName && eventName.textContent === event.name) {
                            // Update button
                            button.textContent = 'Mark Attending';
                            button.classList.remove('btn-unattend');
                            button.classList.add('btn-join');
                            button.disabled = false;
                            // Update onclick and data attributes
                            button.setAttribute('onclick', `toggleAttendance('${eventId}', false)`);
                            button.setAttribute('data-is-attending', 'false');
                            // Remove attending badge
                            const badge = card.querySelector('.attending-badge');
                            if (badge) badge.remove();
                            card.classList.remove('attending');
                        }
                    }
                });
                // Reload to update display and sync with server
                await loadActivityData();
            } else {
                updateEventsStatus(`Error: ${data.message || 'Failed to remove attendance'}`);
                console.error('Remove attendance error:', data);
                // Re-enable button on error
                if (button) {
                    button.disabled = false;
                    button.textContent = 'Cancel Attendance';
                }
            }
        } else {
            // Add attendance
            const response = await fetch(`${API_BASE_URL}/activities/events/${eventId}/attend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });
            
            const data = await safeJsonParse(response);
            if (data.success) {
                if (data.data && data.data.rewards) {
                    const points = data.data.rewards.pointsEarned || 0;
                    const totalPoints = data.data.rewards.totalPoints || 0;
                    const streak = data.data.rewards.streakLength || 0;
                    updateEventsStatus(`✓ Attended! Earned ${points} points${streak > 0 ? ` (${streak} day streak)` : ''} | Total: ${totalPoints} pts`);
                    // Refresh rewards display
                    if (window.location.pathname === '/rewards.html' && typeof loadRewardsData === 'function') {
                        setTimeout(loadRewardsData, 500);
                    }
                } else {
                    updateEventsStatus('✓ Event attendance logged successfully!');
                }
                // Update the event in allEvents immediately
                const event = allEvents.find(e => e.eventId === eventId);
                if (event) {
                    event.isAttending = true;
                }
                // Force immediate UI update before reload
                const eventCards = document.querySelectorAll('.event-card');
                eventCards.forEach(card => {
                    const button = card.querySelector('.btn-attend');
                    if (button && button.onclick && button.onclick.toString().includes(eventId)) {
                        const eventName = card.querySelector('.event-name');
                        if (eventName && eventName.textContent === event.name) {
                            // Update button
                            button.textContent = 'Cancel Attendance';
                            button.classList.remove('btn-join');
                            button.classList.add('btn-unattend');
                            button.disabled = false;
                            // Update onclick and data attributes
                            button.setAttribute('onclick', `toggleAttendance('${eventId}', true)`);
                            button.setAttribute('data-is-attending', 'true');
                            // Add attending badge
                            const eventFooter = card.querySelector('.event-footer');
                            if (eventFooter && !eventFooter.querySelector('.attending-badge')) {
                                const badge = document.createElement('span');
                                badge.className = 'attending-badge';
                                badge.textContent = '✓ Attending';
                                eventFooter.insertBefore(badge, button);
                            }
                            card.classList.add('attending');
                        }
                    }
                });
                // Reload to update display and sync with server
                await loadActivityData();
            } else {
                updateEventsStatus(`Error: ${data.message || 'Failed to log attendance'}`);
                console.error('Log attendance error:', data);
                // Re-enable button on error
                if (button) {
                    button.disabled = false;
                    button.textContent = 'Mark Attending';
                }
            }
        }
    } catch (error) {
        console.error('Error toggling attendance:', error);
        updateEventsStatus('Failed to update attendance. Please try again.');
    }
}

// Log physical activity (gym, sports, walk, run)
async function logActivity(activityType) {
    try {
        const userId = defaultUserId;
        const today = new Date().toISOString().split('T')[0];
        
        const statusEl = document.getElementById('activity-status');
        if (statusEl) {
            statusEl.textContent = 'Logging...';
            statusEl.style.color = '#888';
        }
        
        const response = await fetch(`${API_BASE_URL}/activities/logs/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                activityType: activityType,
                date: today
            })
        });
        
        if (response.ok) {
            const data = await safeJsonParse(response);
            if (data.success && data.data && data.data.rewards) {
                const points = data.data.rewards.pointsEarned || 0;
                const totalPoints = data.data.rewards.totalPoints || 0;
                const streak = data.data.rewards.streakLength || 0;
                updateActivityStatus(`✓ ${activityType} logged! +${points} points (${streak} day streak) | Total: ${totalPoints} pts`);
                // Refresh rewards display
                if (window.location.pathname === '/rewards.html' && typeof loadRewardsData === 'function') {
                    setTimeout(loadRewardsData, 500);
                }
            } else {
                updateActivityStatus(`✓ ${activityType} activity logged!`);
            }
            // Reload activity data to update stats
            loadActivityData();
        } else {
            updateActivityStatus('Failed to log activity');
        }
    } catch (error) {
        console.error('Error logging activity:', error);
        updateActivityStatus('Error: Please try again');
    }
}

// Log class attendance
async function logClassAttendance() {
    try {
        const userId = defaultUserId;
        const today = new Date().toISOString().split('T')[0];
        
        const statusEl = document.getElementById('class-status');
        if (statusEl) {
            statusEl.textContent = 'Logging...';
            statusEl.style.color = '#888';
        }
        
        const response = await fetch(`${API_BASE_URL}/activities/class-attendance/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: today
            })
        });
        
        if (response.ok) {
            const data = await safeJsonParse(response);
            if (data.success && data.data && data.data.rewards) {
                const points = data.data.rewards.pointsEarned || 0;
                const totalPoints = data.data.rewards.totalPoints || 0;
                const streak = data.data.rewards.streakLength || 0;
                const percentage = data.data.percentage || 0;
                updateClassStatus(`✓ Logged! +${points} points | ${percentage.toFixed(0)}% attendance | ${streak} day streak | Total: ${totalPoints} pts`);
                // Refresh rewards display
                if (window.location.pathname === '/rewards.html' && typeof loadRewardsData === 'function') {
                    setTimeout(loadRewardsData, 500);
                }
            } else {
                updateClassStatus(`✓ Class attendance logged for today`);
            }
            // Reload activity data to update stats
            loadActivityData();
        } else {
            updateClassStatus('Failed to log attendance');
        }
    } catch (error) {
        console.error('Error logging class attendance:', error);
        updateClassStatus('Error: Please try again');
    }
}

// Set total class days
async function setTotalClassDays() {
    try {
        const userId = defaultUserId;
        const totalDaysInput = document.getElementById('total-days-input');
        const totalDays = parseInt(totalDaysInput?.value);
        
        if (!totalDays || totalDays < 1) {
            alert('Please enter a valid number of class days');
            return;
        }
        
        const statusEl = document.getElementById('class-status');
        if (statusEl) {
            statusEl.textContent = 'Setting...';
            statusEl.style.color = '#888';
        }
        
        const response = await fetch(`${API_BASE_URL}/activities/class-attendance/${userId}/total`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                totalDays: totalDays
            })
        });
        
        if (response.ok) {
            const data = await safeJsonParse(response);
            if (data.success) {
                updateClassStatus(`✓ Total class days set to ${totalDays}`);
                if (totalDaysInput) totalDaysInput.value = '';
                // Reload activity data
                loadActivityData();
            } else {
                updateClassStatus(`Error: ${data.message || 'Failed to set total days'}`);
            }
        } else {
            updateClassStatus('Failed to set total days');
        }
    } catch (error) {
        console.error('Error setting total days:', error);
        updateClassStatus('Error: Please try again');
    }
}

// Check budget and award points
async function checkBudgetRewards() {
    try {
        const userId = defaultUserId || 'U001';
        const statusEl = document.getElementById('budget-status');
        if (statusEl) {
            statusEl.textContent = 'Checking budgets...';
            statusEl.style.color = '#888';
        }
        
        const response = await fetch(`${API_BASE_URL}/budgets/check-rewards/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await safeJsonParse(response);
        
        if (response.ok && data.success) {
            const pointsEarned = data.data?.pointsEarned || 0;
            const totalPoints = data.data?.totalPoints || 0;
            const budgetsChecked = data.data?.budgetsChecked || [];
            
            if (budgetsChecked.length === 0) {
                updateBudgetStatus(`No active budgets found. Create a budget to start earning points! | Total: ${totalPoints} pts`);
            } else if (pointsEarned > 0) {
                updateBudgetStatus(`✓ Earned ${pointsEarned} points for staying under budget! | Total: ${totalPoints} pts`);
                // Refresh rewards display
                if (window.location.pathname === '/rewards.html' && typeof loadRewardsData === 'function') {
                    setTimeout(loadRewardsData, 500);
                }
            } else {
                updateBudgetStatus(`${data.message || 'No new rewards'} | Total: ${totalPoints} pts`);
            }
        } else {
            const errorMessage = data.message || 'Failed to check budget';
            updateBudgetStatus(`Error: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error checking budget rewards:', error);
        updateBudgetStatus(`Error: ${error.message || 'Please try again'}`);
    }
}

// Update budget status message
function updateBudgetStatus(message) {
    const statusEl = document.getElementById('budget-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = message.includes('✓') ? '#4CAF50' : '#ff4444';
        setTimeout(() => {
            statusEl.textContent = 'Check your spending';
            statusEl.style.color = '#888';
        }, 5000);
    }
}

// Scroll to events section
function scrollToEvents() {
    const eventsSection = document.querySelector('.events-section');
    if (eventsSection) {
        eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Update status messages
function updateEventsStatus(message) {
    const statusEl = document.getElementById('events-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = message.includes('✓') ? '#4CAF50' : '#FFD700';
        setTimeout(() => {
            statusEl.textContent = 'Mark events as attending above';
            statusEl.style.color = '#888';
        }, 3000);
    }
}

function updateActivityStatus(message) {
    const statusEl = document.getElementById('activity-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = message.includes('✓') ? '#4CAF50' : '#ff4444';
        setTimeout(() => {
            statusEl.textContent = 'Ready to log';
            statusEl.style.color = '#888';
        }, 4000);
    }
}

function updateClassStatus(message) {
    const statusEl = document.getElementById('class-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = message.includes('✓') ? '#4CAF50' : '#ff4444';
        setTimeout(() => {
            statusEl.textContent = 'Not logged today';
            statusEl.style.color = '#888';
        }, 4000);
    }
}

// Initialize summaryData
window.summaryData = null;

// Generate unique transaction ID
function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Toggle add transaction form
function toggleAddTransactionForm() {
    const formContainer = document.getElementById('transaction-form-container');
    const toggleBtn = document.getElementById('toggle-form-btn');
    
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        toggleBtn.innerHTML = '<span>−</span> Cancel';
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tx-date').value = today;
        // Focus on first input
        setTimeout(() => document.getElementById('tx-merchant').focus(), 100);
    } else {
        formContainer.style.display = 'none';
        toggleBtn.innerHTML = '<span>+</span> Add New Transaction';
        // Reset form
        document.getElementById('add-transaction-form').reset();
        document.getElementById('form-message').textContent = '';
        document.getElementById('form-message').className = 'form-message';
    }
}

// Handle add transaction form submission
async function handleAddTransaction(event) {
    event.preventDefault();
    
    const form = event.target;
    const formMessage = document.getElementById('form-message');
    const submitBtn = form.querySelector('.btn-submit');
    
    // Get form values
    const merchant = document.getElementById('tx-merchant').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const category = document.getElementById('tx-category').value;
    const paymentMethod = document.getElementById('tx-payment-method').value;
    const location = document.getElementById('tx-location').value.trim();
    const date = document.getElementById('tx-date').value;
    
    // Validate
    if (!merchant || !amount || !category || !paymentMethod || !date) {
        formMessage.textContent = 'Please fill in all required fields.';
        formMessage.className = 'form-message error';
        return;
    }
    
    if (amount <= 0) {
        formMessage.textContent = 'Amount must be greater than 0.';
        formMessage.className = 'form-message error';
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    formMessage.textContent = 'Adding transaction...';
    formMessage.className = 'form-message info';
    
    try {
        const defaultUserId = 'U001';
        const transactionId = generateTransactionId();
        
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactionId: transactionId,
                userId: defaultUserId,
                merchant: merchant,
                category: category,
                amount: amount,
                paymentMethod: paymentMethod,
                location: location || '',
                date: date
            })
        });
        
        const data = await safeJsonParse(response);
        
        if (response.ok && data.success) {
            formMessage.textContent = `✓ Transaction added successfully! $${amount.toFixed(2)} at ${merchant}`;
            formMessage.className = 'form-message success';
            
            // Reset form
            form.reset();
            // Set today's date again
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('tx-date').value = today;
            
            // Reload budgeting data immediately to show new transaction
            // Force refresh with a small delay to ensure backend has saved
            console.log('✅ Transaction added, refreshing data...');
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms for backend to save
            await loadBudgetingData();
            console.log('✅ Budgeting data refreshed');
            
            // Close form after showing success message (but keep it open longer to see the new transaction)
            setTimeout(() => {
                toggleAddTransactionForm();
            }, 3000);
        } else {
            formMessage.textContent = data.message || 'Failed to add transaction. Please try again.';
            formMessage.className = 'form-message error';
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        formMessage.textContent = 'Error: Could not add transaction. Please check your connection.';
        formMessage.className = 'form-message error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Transaction';
    }
}

// Rewards API Integration
async function loadRewardsData() {
    const contentDiv = document.getElementById('rewards-content');
    if (!contentDiv) return;

    try {
        const defaultUserId = 'U001';
        
        // Fetch rewards summary with userId
        const response = await fetch(`${API_BASE_URL}/rewards/summary/${defaultUserId}`);
        const data = await safeJsonParse(response);
        
        if (data.success && data.data) {
            let html = '<div class="rewards-dashboard">';
            
            // Points Hero Section
            const totalPoints = data.data.totalPoints || 0;
            const isFireTier = totalPoints >= 10000;
            
            html += `<div class="points-hero ${isFireTier ? 'fire-tier' : ''}">
                <div class="points-icon">${isFireTier ? '🔥' : '🏆'}</div>
                <div class="points-content">
                    <h3 class="points-label">Total Reward Points</h3>
                    <p class="points-value">${totalPoints.toLocaleString()}</p>
                    <div class="points-subtitle">
                        ${isFireTier ? '🔥 Fire Tier Member - All rewards cost 50% less! 🔥' : `Keep earning points for your activities! ${10000 - totalPoints} points until Fire Tier`}
                    </div>
                </div>
            </div>`;
            
            // Rewards Tiers Section
            html += '<div class="rewards-section"><h3 class="section-subtitle">Redeem Your Points</h3>';
            html += '<div class="rewards-tiers-container">';
            
            // Calculate available vouchers
            const pointsFor5Dollar = isFireTier ? 100 : 200; // Fire tier: half points
            const pointsFor10Dollar = isFireTier ? 500 : 1000; // Fire tier: half points
            
            const available5Dollar = Math.floor(totalPoints / pointsFor5Dollar);
            const available10Dollar = Math.floor(totalPoints / pointsFor10Dollar);
            const pointsUntil5Dollar = pointsFor5Dollar - (totalPoints % pointsFor5Dollar);
            const pointsUntil10Dollar = pointsFor10Dollar - (totalPoints % pointsFor10Dollar);
            
            // $5 Gift Card Tier
            html += `<div class="tier-card tier-bronze ${available5Dollar > 0 ? 'available' : ''}">
                <div class="tier-header">
                    <div class="tier-icon">🎁</div>
                    <div class="tier-info">
                        <h4 class="tier-title">$5 Gift Card</h4>
                        <p class="tier-points">${pointsFor5Dollar} points ${isFireTier ? '<span class="fire-badge">🔥 Fire Tier</span>' : ''}</p>
                    </div>
                </div>
                <div class="tier-rewards">
                    <p class="tier-merchants">Available at: <strong>Dunkin</strong>, <strong>Starbucks</strong>, <strong>Target</strong>, <strong>CVS</strong>, and more</p>
                    ${available5Dollar > 0 
                        ? `<div class="tier-available">
                            <span class="available-count">${available5Dollar} voucher${available5Dollar > 1 ? 's' : ''} available!</span>
                            <button class="redeem-btn" onclick="alert('Contact support to redeem your $5 gift card vouchers!')">Redeem Now</button>
                          </div>`
                        : `<div class="tier-progress">
                            <span class="progress-text">${pointsUntil5Dollar} more points needed</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${((totalPoints % pointsFor5Dollar) / pointsFor5Dollar) * 100}%"></div>
                            </div>
                          </div>`
                    }
                </div>
            </div>`;
            
            // $10 Gift Card Tier
            html += `<div class="tier-card tier-silver ${available10Dollar > 0 ? 'available' : ''}">
                <div class="tier-header">
                    <div class="tier-icon">💎</div>
                    <div class="tier-info">
                        <h4 class="tier-title">$10 Gift Card</h4>
                        <p class="tier-points">${pointsFor10Dollar} points ${isFireTier ? '<span class="fire-badge">🔥 Fire Tier</span>' : ''}</p>
                    </div>
                </div>
                <div class="tier-rewards">
                    <p class="tier-merchants">Available at: <strong>Dunkin</strong>, <strong>Starbucks</strong>, <strong>Target</strong>, <strong>CVS</strong>, and more</p>
                    ${available10Dollar > 0 
                        ? `<div class="tier-available">
                            <span class="available-count">${available10Dollar} voucher${available10Dollar > 1 ? 's' : ''} available!</span>
                            <button class="redeem-btn" onclick="alert('Contact support to redeem your $10 gift card vouchers!')">Redeem Now</button>
                          </div>`
                        : `<div class="tier-progress">
                            <span class="progress-text">${pointsUntil10Dollar} more points needed</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${((totalPoints % pointsFor10Dollar) / pointsFor10Dollar) * 100}%"></div>
                            </div>
                          </div>`
                    }
                </div>
            </div>`;
            
            // Fire Tier Info
            if (!isFireTier) {
                const pointsUntilFireTier = 10000 - totalPoints;
                html += `<div class="tier-card tier-fire">
                    <div class="tier-header">
                        <div class="tier-icon">🔥</div>
                        <div class="tier-info">
                            <h4 class="tier-title">Fire Tier</h4>
                            <p class="tier-points">10,000 points to unlock</p>
                        </div>
                    </div>
                    <div class="tier-rewards">
                        <p class="tier-benefit">🔥 <strong>Unlock Fire Tier Benefits:</strong></p>
                        <ul class="fire-benefits">
                            <li>All gift card rewards cost <strong>50% less</strong> for the entire year!</li>
                            <li>$5 gift cards: 100 points (instead of 200)</li>
                            <li>$10 gift cards: 500 points (instead of 1000)</li>
                            <li>Exclusive Fire Tier badge and recognition</li>
                        </ul>
                        <div class="tier-progress">
                            <span class="progress-text">${pointsUntilFireTier.toLocaleString()} points until Fire Tier</span>
                            <div class="progress-bar fire-progress">
                                <div class="progress-fill fire-fill" style="width: ${(totalPoints / 10000) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            } else {
                html += `<div class="tier-card tier-fire active">
                    <div class="tier-header">
                        <div class="tier-icon">🔥</div>
                        <div class="tier-info">
                            <h4 class="tier-title">Fire Tier - ACTIVE</h4>
                            <p class="tier-points">Enjoy 50% off all rewards!</p>
                        </div>
                    </div>
                    <div class="tier-rewards">
                        <p class="tier-benefit">🔥 <strong>Your Fire Tier Benefits:</strong></p>
                        <ul class="fire-benefits">
                            <li>✅ All gift card rewards cost <strong>50% less</strong> for the entire year!</li>
                            <li>✅ $5 gift cards: 100 points (instead of 200)</li>
                            <li>✅ $10 gift cards: 500 points (instead of 1000)</li>
                            <li>✅ Exclusive Fire Tier badge and recognition</li>
                        </ul>
                    </div>
                </div>`;
            }
            
            html += '</div></div>';
            
            // Points Breakdown Section
            if (data.data.pointsBreakdown) {
                const breakdown = data.data.pointsBreakdown;
                html += '<div class="rewards-section"><h3 class="section-subtitle">Points Breakdown</h3>';
                html += '<div class="points-breakdown-grid">';
                
                // Class Attendance
                html += `<div class="breakdown-card">
                    <div class="breakdown-icon">🎓</div>
                    <div class="breakdown-content">
                        <h4 class="breakdown-title">Class Attendance</h4>
                        <p class="breakdown-points">${breakdown.classAttendance.toLocaleString()} points</p>
                        <p class="breakdown-value">200 points per day</p>
                        <div class="breakdown-count">${Math.floor(breakdown.classAttendance / 200)} days logged</div>
                    </div>
                </div>`;
                
                // Physical Activities
                html += `<div class="breakdown-card">
                    <div class="breakdown-icon">💪</div>
                    <div class="breakdown-content">
                        <h4 class="breakdown-title">Physical Activities</h4>
                        <p class="breakdown-points">${breakdown.physicalActivities.toLocaleString()} points</p>
                        <p class="breakdown-value">100 points per activity</p>
                        <div class="breakdown-count">${Math.floor(breakdown.physicalActivities / 100)} activities logged</div>
                    </div>
                </div>`;
                
                // Paid Events
                html += `<div class="breakdown-card">
                    <div class="breakdown-icon">💎</div>
                    <div class="breakdown-content">
                        <h4 class="breakdown-title">Paid Events</h4>
                        <p class="breakdown-points">${breakdown.paidEvents.toLocaleString()} points</p>
                        <p class="breakdown-value">300 points per event</p>
                        <div class="breakdown-count">${Math.floor(breakdown.paidEvents / 300)} events attended</div>
                    </div>
                </div>`;
                
                // Free Events
                html += `<div class="breakdown-card">
                    <div class="breakdown-icon">📅</div>
                    <div class="breakdown-content">
                        <h4 class="breakdown-title">Free Events</h4>
                        <p class="breakdown-points">${breakdown.freeEvents.toLocaleString()} points</p>
                        <p class="breakdown-value">150 points per event</p>
                        <div class="breakdown-count">${Math.floor(breakdown.freeEvents / 150)} events attended</div>
                    </div>
                </div>`;
                
                // Budget Checks
                html += `<div class="breakdown-card">
                    <div class="breakdown-icon">💰</div>
                    <div class="breakdown-content">
                        <h4 class="breakdown-title">Budget Compliance</h4>
                        <p class="breakdown-points">${breakdown.budgetChecks.toLocaleString()} points</p>
                        <p class="breakdown-value">50 points per check</p>
                        <div class="breakdown-count">${Math.floor(breakdown.budgetChecks / 50)} budgets under limit</div>
                    </div>
                </div>`;
                
                html += '</div></div>';
            }
            
            // Streaks Section
            if (data.data.streaks) {
                html += '<div class="rewards-section"><h3 class="section-subtitle">Your Streaks</h3>';
                html += '<div class="streaks-container">';
                
                const streaks = data.data.streaks;
                const today = new Date().toISOString().split('T')[0];
                const isActiveToday = (lastDate) => lastDate === today;
                
                // Class Attendance Streak
                const classStreak = streaks.classAttendance?.current || 0;
                const classLastDate = streaks.classAttendance?.lastDate;
                html += `<div class="streak-card ${isActiveToday(classLastDate) ? 'active' : ''}">
                    <div class="streak-icon">🎓</div>
                    <div class="streak-content">
                        <h4 class="streak-title">Class Attendance</h4>
                        <p class="streak-days">${classStreak} day${classStreak !== 1 ? 's' : ''} streak</p>
                        <p class="streak-status">${isActiveToday(classLastDate) ? '✓ Active today' : 'Log today to continue'}</p>
                    </div>
                </div>`;
                
                // Activities Streak
                const activitiesStreak = streaks.activities?.current || 0;
                const activitiesLastDate = streaks.activities?.lastDate;
                html += `<div class="streak-card ${isActiveToday(activitiesLastDate) ? 'active' : ''}">
                    <div class="streak-icon">💪</div>
                    <div class="streak-content">
                        <h4 class="streak-title">Physical Activities</h4>
                        <p class="streak-days">${activitiesStreak} day${activitiesStreak !== 1 ? 's' : ''} streak</p>
                        <p class="streak-status">${isActiveToday(activitiesLastDate) ? '✓ Active today' : 'Log today to continue'}</p>
                    </div>
                </div>`;
                
                // Events Streak
                const eventsStreak = streaks.events?.current || 0;
                const eventsLastDate = streaks.events?.lastDate;
                html += `<div class="streak-card ${isActiveToday(eventsLastDate) ? 'active' : ''}">
                    <div class="streak-icon">📅</div>
                    <div class="streak-content">
                        <h4 class="streak-title">Events Attendance</h4>
                        <p class="streak-days">${eventsStreak} day${eventsStreak !== 1 ? 's' : ''} streak</p>
                        <p class="streak-status">${isActiveToday(eventsLastDate) ? '✓ Active today' : 'Attend an event today'}</p>
                    </div>
                </div>`;
                
                // App Usage Streak (signing in and using the app)
                const appStreak = Math.max(classStreak, activitiesStreak, eventsStreak);
                html += `<div class="streak-card ${appStreak > 0 ? 'active' : ''}">
                    <div class="streak-icon">🔥</div>
                    <div class="streak-content">
                        <h4 class="streak-title">App Usage Streak</h4>
                        <p class="streak-days">${appStreak} day${appStreak !== 1 ? 's' : ''} streak</p>
                        <p class="streak-status">Keep using the app daily!</p>
                    </div>
                </div>`;
                
                html += '</div></div>';
            }
            
            // Leaderboard Section
            html += '<div class="rewards-section"><h3 class="section-subtitle">🏆 Leaderboard</h3>';
            html += '<div class="leaderboard-container">';
            html += '<table class="leaderboard-table">';
            html += '<thead><tr><th>Rank</th><th>Name</th><th>Points</th><th>Tier</th></tr></thead>';
            html += '<tbody>';
            
            // Fabricated leaderboard data
            const leaderboardData = [
                { name: 'Alex Chen', points: 12500, tier: 'Gold' },
                { name: 'Sarah Johnson', points: 9800, tier: 'Gold' },
                { name: 'Michael Park', points: 8750, tier: 'Gold' },
                { name: 'Emily Davis', points: 7200, tier: 'Silver' },
                { name: 'David Kim', points: 6500, tier: 'Silver' },
                { name: 'Jessica Martinez', points: 5800, tier: 'Silver' },
                { name: 'Ryan Thompson', points: 4900, tier: 'Bronze' },
                { name: 'Olivia Wilson', points: 4200, tier: 'Bronze' },
                { name: 'James Brown', points: 3600, tier: 'Bronze' },
                { name: 'Sophia Anderson', points: totalPoints, tier: totalPoints >= 5000 ? 'Gold' : totalPoints >= 3000 ? 'Silver' : 'Bronze' }
            ];
            
            // Sort by points (descending)
            leaderboardData.sort((a, b) => b.points - a.points);
            
            leaderboardData.forEach((user, index) => {
                const rank = index + 1;
                const isCurrentUser = user.name === 'Sophia Anderson';
                const rowClass = isCurrentUser ? 'current-user' : '';
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                
                // Only rank #1 gets Fire Tier, everyone else uses normal tier
                const displayTier = rank === 1 ? '🔥 Fire' : user.tier;
                
                html += `<tr class="${rowClass}">
                    <td class="rank-cell">${medal} ${rank}</td>
                    <td class="name-cell">${user.name} ${isCurrentUser ? '<span class="you-badge">(You)</span>' : ''}</td>
                    <td class="points-cell">${user.points.toLocaleString()}</td>
                    <td class="tier-cell">${displayTier}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div></div>';
            
            // Achievements Section
            if (data.data.achievements && data.data.achievements.length > 0) {
                html += '<div class="rewards-section"><h3 class="section-subtitle">Achievements</h3>';
                html += '<div class="achievements-grid">';
                data.data.achievements.forEach(ach => {
                    const achName = ach.name || ach.achievementId || 'Achievement';
                    const points = ach.points || 0;
                    const earnedDate = ach.earnedAt ? new Date(ach.earnedAt).toLocaleDateString() : '';
                    
                    html += `<div class="achievement-card">
                        <div class="achievement-icon">🏅</div>
                        <div class="achievement-content">
                            <h4 class="achievement-name">${achName}</h4>
                            <div class="achievement-points">+${points} points</div>
                            ${earnedDate ? `<div class="achievement-date">Earned: ${earnedDate}</div>` : ''}
                        </div>
                    </div>`;
                });
                html += '</div></div>';
            } else {
                html += '<div class="rewards-section"><h3 class="section-subtitle">Achievements</h3>';
                html += '<div class="no-achievements">Complete activities and events to unlock achievements!</div></div>';
            }
            
            // Rewards Info Section
            html += '<div class="rewards-info-section">';
            html += '<h3 class="section-subtitle">How to Earn Points</h3>';
            html += '<div class="info-cards">';
            html += '<div class="info-card"><div class="info-icon">📅</div><div class="info-text"><strong>Attend Events</strong><br>Earn points for every campus event you attend</div></div>';
            html += '<div class="info-card"><div class="info-icon">🎓</div><div class="info-text"><strong>Class Attendance</strong><br>Build streaks for consistent class attendance</div></div>';
            html += '<div class="info-card"><div class="info-icon">💪</div><div class="info-text"><strong>Physical Activities</strong><br>Log gym sessions, sports, walks, and runs</div></div>';
            html += '<div class="info-card"><div class="info-icon">💰</div><div class="info-text"><strong>Stay Under Budget</strong><br>Rewards for smart spending habits</div></div>';
            html += '</div></div>';
            
            html += '</div>';
            contentDiv.innerHTML = html;
            console.log('✅ Rewards data loaded and displayed');
        } else {
            contentDiv.innerHTML = '<div class="no-data">No rewards data available yet. Start participating to earn points!</div>';
        }
    } catch (error) {
        console.error('❌ Rewards API Error:', error);
        contentDiv.innerHTML = `<div class="error">Error loading rewards data: ${error.message}</div>`;
    }
}

