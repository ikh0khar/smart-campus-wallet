// API Configuration
const API_BASE_URL = window.location.origin + '/api';

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
        const data = await response.json();
        console.log('✅ API Connected:', data.message);
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
        // Fetch transactions summary
        const summaryResponse = await fetch(`${API_BASE_URL}/transactions/summary`);
        const summaryData = await summaryResponse.json();
        
        // Fetch transactions
        const transactionsResponse = await fetch(`${API_BASE_URL}/transactions?limit=10`);
        const transactionsData = await transactionsResponse.json();
        
        // Fetch category breakdown
        const categoriesResponse = await fetch(`${API_BASE_URL}/transactions/categories`);
        const categoriesData = await categoriesResponse.json();
        
        if (summaryData.success && transactionsData.success && categoriesData.success) {
            let html = '<div class="budget-dashboard">';
            
            // Summary cards
            html += '<div class="summary-cards">';
            html += `<div class="summary-card"><h3>Total Spent</h3><p class="amount">$${summaryData.data.total.toFixed(2)}</p></div>`;
            html += `<div class="summary-card"><h3>Transactions</h3><p class="amount">${summaryData.data.count}</p></div>`;
            html += `<div class="summary-card"><h3>Average</h3><p class="amount">$${summaryData.data.average.toFixed(2)}</p></div>`;
            html += `<div class="summary-card"><h3>Daily Average</h3><p class="amount">$${summaryData.data.dailyAverage.toFixed(2)}</p></div>`;
            html += '</div>';
            
            // Category breakdown
            if (categoriesData.data && categoriesData.data.length > 0) {
                html += '<div class="category-breakdown"><h3>Spending by Category</h3><ul class="category-list">';
                categoriesData.data.slice(0, 5).forEach(cat => {
                    html += `<li><span class="category-name">${cat.category}</span> <span class="category-amount">$${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)</span></li>`;
                });
                html += '</ul></div>';
            }
            
            // Recent transactions
            if (transactionsData.data && transactionsData.data.length > 0) {
                html += '<div class="recent-transactions"><h3>Recent Transactions</h3><ul class="transaction-list">';
                transactionsData.data.slice(0, 5).forEach(tx => {
                    html += `<li><span class="tx-desc">${tx.description || tx.merchant || 'Transaction'}</span> <span class="tx-amount">$${tx.amount.toFixed(2)}</span> <span class="tx-category">${tx.category}</span></li>`;
                });
                html += '</ul></div>';
            }
            
            html += '</div>';
            contentDiv.innerHTML = html;
            console.log('✅ Budgeting data loaded and displayed');
        }
    } catch (error) {
        console.error('❌ Budgeting API Error:', error);
        contentDiv.innerHTML = `<div class="error">Error loading budgeting data: ${error.message}</div>`;
    }
}

// Global variables for activity page
let allEvents = [];
let defaultUserId = 'user123';

// Activity API Integration
async function loadActivityData() {
    const contentDiv = document.getElementById('activity-content');
    if (!contentDiv) return;

    try {
        // Fetch all events with user attendance status
        const eventsResponse = await fetch(`${API_BASE_URL}/activities/events?userId=${defaultUserId}`);
        const eventsData = await eventsResponse.json();
        
        // Fetch activity summary
        const summaryResponse = await fetch(`${API_BASE_URL}/activities/summary/${defaultUserId}`);
        const summaryData = await summaryResponse.json();
        
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
    
    // Get current filter
    const activeFilter = document.querySelector('.filter-btn.active');
    const filter = activeFilter ? activeFilter.dataset.filter : 'all';
    
    // Filter events
    let filteredEvents = events;
    if (filter === 'free') {
        filteredEvents = events.filter(e => e.isFree === true);
    } else if (filter === 'paid') {
        filteredEvents = events.filter(e => e.isFree === false);
    } else if (filter === 'my') {
        filteredEvents = events.filter(e => e.isAttending === true);
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
                    <button class="btn-attend ${isAttending ? 'btn-unattend' : 'btn-join'}" onclick="toggleAttendance('${event.eventId}', ${isAttending})">
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
    }
    
    html += '</div>';
    contentDiv.innerHTML = html;
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

// Filter events
function filterEvents(filter) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Re-display events with new filter
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
        
        if (currentlyAttending) {
            // Remove attendance
            const response = await fetch(`${API_BASE_URL}/activities/events/${eventId}/attend`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });
            
            if (response.ok) {
                // Update the event in allEvents
                const event = allEvents.find(e => e.eventId === eventId);
                if (event) {
                    event.isAttending = false;
                }
                // Reload to update display
                loadActivityData();
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
            
            if (response.ok) {
                // Update the event in allEvents
                const event = allEvents.find(e => e.eventId === eventId);
                if (event) {
                    event.isAttending = true;
                }
                // Reload to update display
                loadActivityData();
            }
        }
    } catch (error) {
        console.error('Error toggling attendance:', error);
        alert('Failed to update attendance. Please try again.');
    }
}

// Initialize summaryData
window.summaryData = null;

// Rewards API Integration
async function loadRewardsData() {
    const contentDiv = document.getElementById('rewards-content');
    if (!contentDiv) return;

    try {
        const defaultUserId = 'user123';
        
        // Fetch rewards summary with userId
        const response = await fetch(`${API_BASE_URL}/rewards/summary/${defaultUserId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            let html = '<div class="rewards-dashboard">';
            
            // Points Hero Section
            const totalPoints = data.data.points || 0;
            html += `<div class="points-hero">
                <div class="points-icon">🏆</div>
                <div class="points-content">
                    <h3 class="points-label">Total Reward Points</h3>
                    <p class="points-value">${totalPoints.toLocaleString()}</p>
                    <div class="points-subtitle">Keep earning points for your activities!</div>
                </div>
            </div>`;
            
            // Streaks Section
            if (data.data.streaks && data.data.streaks.length > 0) {
                html += '<div class="rewards-section"><h3 class="section-subtitle">Active Streaks</h3>';
                html += '<div class="streaks-grid">';
                data.data.streaks.forEach(streak => {
                    const streakType = streak.type || 'streak';
                    const current = streak.current || 0;
                    const longest = streak.longest || 0;
                    const streakName = streakType.charAt(0).toUpperCase() + streakType.slice(1).replace(/([A-Z])/g, ' $1');
                    
                    html += `<div class="streak-card">
                        <div class="streak-icon">🔥</div>
                        <div class="streak-content">
                            <h4 class="streak-name">${streakName}</h4>
                            <div class="streak-stats">
                                <div class="streak-current">
                                    <span class="streak-number">${current}</span>
                                    <span class="streak-label">Current</span>
                                </div>
                                <div class="streak-longest">
                                    <span class="streak-number">${longest}</span>
                                    <span class="streak-label">Longest</span>
                                </div>
                            </div>
                            ${current > 0 ? '<div class="streak-fire">Keep the fire going! 🔥</div>' : ''}
                        </div>
                    </div>`;
                });
                html += '</div></div>';
            } else {
                html += '<div class="rewards-section"><h3 class="section-subtitle">Active Streaks</h3>';
                html += '<div class="no-streaks">Start building your streaks by attending events and activities!</div></div>';
            }
            
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
