/**
 * API Examples for Frontend Integration
 * Copy and adapt these examples to your frontend code
 */

const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// EXAMPLE 1: Basic Fetch with async/await
// ============================================

async function getTransactions(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions?userId=${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error('Failed to fetch transactions');
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// ============================================
// EXAMPLE 2: Category Breakdown (for Charts)
// ============================================

async function getCategoryBreakdown(userId, startDate, endDate) {
  try {
    let url = `${API_BASE_URL}/transactions/categories?userId=${userId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      // Data is already formatted for charts!
      // data.data = [{ category, amount, count, percentage }, ...]
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    throw error;
  }
}

// ============================================
// EXAMPLE 3: Spending Summary
// ============================================

async function getSpendingSummary(userId, startDate, endDate) {
  try {
    let url = `${API_BASE_URL}/transactions/summary?userId=${userId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.data; // { total, count, average, dailyAverage, weeklyAverage, monthlyAverage }
    }
  } catch (error) {
    console.error('Error fetching spending summary:', error);
    throw error;
  }
}

// ============================================
// EXAMPLE 4: Spending Trends (for Line Charts)
// ============================================

async function getSpendingTrends(userId, period = 'daily', startDate, endDate) {
  try {
    let url = `${API_BASE_URL}/transactions/trends?userId=${userId}&period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      // data.data = [{ date, amount, count }, ...]
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching spending trends:', error);
    throw error;
  }
}

// ============================================
// EXAMPLE 5: Budgets
// ============================================

async function getBudgets(isActive = true) {
  try {
    const url = `${API_BASE_URL}/budgets${isActive ? '?isActive=true' : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.data; // Array of budgets with progress
    }
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
}

// ============================================
// EXAMPLE 6: Budget Progress (for Progress Bars)
// ============================================

async function getBudgetProgress(budgetId) {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}/progress`);
    const data = await response.json();
    
    if (data.success) {
      // data.data.chartData is ready for charts!
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching budget progress:', error);
    throw error;
  }
}

// ============================================
// EXAMPLE 7: React Hook Example
// ============================================

/*
import { useState, useEffect } from 'react';

function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        const data = await getTransactions(userId);
        setTransactions(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  return { transactions, loading, error };
}

// Usage in component:
function TransactionsList({ userId }) {
  const { transactions, loading, error } = useTransactions(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {transactions.map(t => (
        <li key={t.id}>
          {t.description}: ${t.amount} ({t.category})
        </li>
      ))}
    </ul>
  );
}
*/

// ============================================
// EXAMPLE 8: Chart.js Integration Example
// ============================================

/*
async function loadChartData(userId) {
  const categoryData = await getCategoryBreakdown(userId);
  
  // Format for Chart.js
  const chartData = {
    labels: categoryData.map(item => item.category),
    datasets: [{
      label: 'Spending by Category',
      data: categoryData.map(item => item.amount),
      backgroundColor: [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // yellow
        '#ef4444', // red
        '#8b5cf6', // purple
      ],
    }],
  };
  
  return chartData;
}
*/

// ============================================
// Export for use in frontend
// ============================================

// If using ES6 modules:
// export { getTransactions, getCategoryBreakdown, getSpendingSummary, getSpendingTrends, getBudgets, getBudgetProgress };

// If using CommonJS:
// module.exports = { getTransactions, getCategoryBreakdown, getSpendingSummary, getSpendingTrends, getBudgets, getBudgetProgress };

