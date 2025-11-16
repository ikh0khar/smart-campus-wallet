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

    // Load data when sections are visible
    loadBudgetingData();
    loadActivityData();
    loadRewardsData();
}

// Budgeting and Spending API Integration
async function loadBudgetingData() {
    try {
        // Fetch transactions summary
        const summaryResponse = await fetch(`${API_BASE_URL}/transactions/summary`);
        const summaryData = await summaryResponse.json();
        
        if (summaryData.success) {
            console.log('📊 Budget Summary:', summaryData.data);
        }

        // Fetch transactions
        const transactionsResponse = await fetch(`${API_BASE_URL}/transactions`);
        const transactionsData = await transactionsResponse.json();
        
        if (transactionsData.success) {
            console.log(`💰 Transactions (${transactionsData.count}):`, transactionsData.data.slice(0, 5));
        }

        // Fetch category breakdown
        const categoriesResponse = await fetch(`${API_BASE_URL}/transactions/categories`);
        const categoriesData = await categoriesResponse.json();
        
        if (categoriesData.success) {
            console.log('📈 Categories:', categoriesData.data);
        }
    } catch (error) {
        console.error('❌ Budgeting API Error:', error);
    }
}

// Activity API Integration
async function loadActivityData() {
    try {
        const response = await fetch(`${API_BASE_URL}/activities/timeline`);
        const data = await response.json();
        
        if (data.success) {
            console.log('🎯 Activity Timeline:', data.data.slice(0, 5));
        }
    } catch (error) {
        console.error('❌ Activity API Error:', error);
    }
}

// Rewards API Integration
async function loadRewardsData() {
    try {
        const response = await fetch(`${API_BASE_URL}/rewards/summary`);
        const data = await response.json();
        
        if (data.success) {
            console.log('🏆 Rewards Summary:', data.data);
        }
    } catch (error) {
        console.error('❌ Rewards API Error:', error);
    }
}
