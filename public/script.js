// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    function toggleMenu() {
        sideMenu.classList.toggle('open');
        menuOverlay.classList.toggle('active');
        menuToggle.classList.toggle('active');
    }
    
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', toggleMenu);
    }
    
    // Close menu when clicking on menu items
    const menuItems = document.querySelectorAll('.side-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            setTimeout(toggleMenu, 300); // Small delay for smooth transition
        });
    });

    // Initialize API calls when navigating to sections
    initializeAPIIntegration();
});

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
    
    // Only load rewards if on homepage
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
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

// Activity API Integration
async function loadActivityData() {
    const contentDiv = document.getElementById('activity-content');
    if (!contentDiv) return;

    try {
        // Use a default userId for demo purposes (you can change this later)
        const defaultUserId = 'user123';
        
        // Fetch activity summary
        const summaryResponse = await fetch(`${API_BASE_URL}/activities/summary/${defaultUserId}`);
        const summaryData = await summaryResponse.json();
        
        // Fetch events
        const eventsResponse = await fetch(`${API_BASE_URL}/activities/events`);
        const eventsData = await eventsResponse.json();
        
        if (summaryData.success) {
            let html = '<div class="activity-dashboard">';
            
            // Events section
            if (summaryData.data.events && summaryData.data.events.totalAttended > 0) {
                html += '<div class="activity-section"><h3>Events Attended</h3>';
                html += `<p class="activity-stat">Total: ${summaryData.data.events.totalAttended} events</p>`;
                if (summaryData.data.events.events && summaryData.data.events.events.length > 0) {
                    html += '<ul class="timeline-list">';
                    summaryData.data.events.events.slice(0, 10).forEach(event => {
                        const eventDate = event.startTime ? new Date(event.startTime).toLocaleDateString() : 'Date TBD';
                        html += `<li class="timeline-item">
                            <span class="activity-type">📅 ${event.name || 'Event'}</span>
                            <span class="activity-date">${eventDate}</span>
                            ${event.location ? `<span class="activity-desc">📍 ${event.location}</span>` : ''}
                        </li>`;
                    });
                    html += '</ul></div>';
                }
            }
            
            // Class Attendance section
            if (summaryData.data.classAttendance) {
                html += '<div class="activity-section"><h3>Class Attendance</h3>';
                html += `<p class="activity-stat">${summaryData.data.classAttendance.attendedDays || 0} / ${summaryData.data.classAttendance.totalDays || 0} days (${(summaryData.data.classAttendance.percentage || 0).toFixed(1)}%)</p></div>`;
            }
            
            // Activities section (Gym, Sports, Walk, Run)
            if (summaryData.data.activities && summaryData.data.activities.total > 0) {
                html += '<div class="activity-section"><h3>Physical Activities</h3>';
                html += '<ul class="activity-stats">';
                if (summaryData.data.activities.gym.count > 0) {
                    html += `<li>💪 Gym: ${summaryData.data.activities.gym.count} sessions</li>`;
                }
                if (summaryData.data.activities.sports.count > 0) {
                    html += `<li>⚽ Sports: ${summaryData.data.activities.sports.count} sessions</li>`;
                }
                if (summaryData.data.activities.walk.count > 0) {
                    html += `<li>🚶 Walk: ${summaryData.data.activities.walk.count} sessions</li>`;
                }
                if (summaryData.data.activities.run.count > 0) {
                    html += `<li>🏃 Run: ${summaryData.data.activities.run.count} sessions</li>`;
                }
                html += `</ul><p class="activity-stat">Total: ${summaryData.data.activities.total} activities</p></div>`;
            }
            
            // If no data available
            if (!summaryData.data.events || summaryData.data.events.totalAttended === 0) {
                if (!summaryData.data.activities || summaryData.data.activities.total === 0) {
                    html += '<div class="no-data">No activity data available yet. Start logging your activities!</div>';
                }
            }
            
            html += '</div>';
            contentDiv.innerHTML = html;
            console.log('✅ Activity data loaded and displayed');
        } else {
            contentDiv.innerHTML = '<div class="no-data">No activity data available yet.</div>';
        }
    } catch (error) {
        console.error('❌ Activity API Error:', error);
        contentDiv.innerHTML = `<div class="error">Error loading activity data: ${error.message}</div>`;
    }
}

// Rewards API Integration
async function loadRewardsData() {
    const contentDiv = document.getElementById('rewards-content');
    if (!contentDiv) return;

    try {
        const response = await fetch(`${API_BASE_URL}/rewards/summary`);
        const data = await response.json();
        
        if (data.success && data.data) {
            let html = '<div class="rewards-dashboard">';
            
            // Points display
            if (data.data.points !== undefined) {
                html += `<div class="points-display"><h3>Total Points</h3><p class="points-value">${data.data.points.toLocaleString()}</p></div>`;
            }
            
            // Streaks
            if (data.data.streaks && data.data.streaks.length > 0) {
                html += '<div class="streaks-display"><h3>Streaks</h3><ul class="streaks-list">';
                data.data.streaks.forEach(streak => {
                    html += `<li><span class="streak-type">${streak.type || 'Streak'}</span> <span class="streak-days">${streak.current || 0} days</span></li>`;
                });
                html += '</ul></div>';
            }
            
            // Achievements
            if (data.data.achievements && data.data.achievements.length > 0) {
                html += '<div class="achievements-display"><h3>Achievements</h3><ul class="achievements-list">';
                data.data.achievements.slice(0, 5).forEach(ach => {
                    html += `<li><span class="ach-name">${ach.name || ach.achievementId || 'Achievement'}</span> <span class="ach-points">+${ach.points || 0} pts</span></li>`;
                });
                html += '</ul></div>';
            }
            
            html += '</div>';
            contentDiv.innerHTML = html;
            console.log('✅ Rewards data loaded and displayed');
        } else {
            contentDiv.innerHTML = '<div class="no-data">No rewards data available yet.</div>';
        }
    } catch (error) {
        console.error('❌ Rewards API Error:', error);
        contentDiv.innerHTML = `<div class="error">Error loading rewards data: ${error.message}</div>`;
    }
}
