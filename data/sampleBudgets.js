// Sample budget data

const sampleBudgets = [
  {
    id: 1,
    userId: 1,
    name: 'Monthly Food Budget',
    category: 'food',
    amount: 200.00,
    period: 'monthly',
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    spent: 53.00,
    isActive: true,
  },
  {
    id: 2,
    userId: 1,
    name: 'Semester Books Budget',
    category: 'books',
    amount: 500.00,
    period: 'semester',
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    spent: 165.99,
    isActive: true,
  },
  {
    id: 3,
    userId: 1,
    name: 'Weekly Entertainment',
    category: 'entertainment',
    amount: 50.00,
    period: 'weekly',
    startDate: '2025-11-04',
    endDate: '2025-11-10',
    spent: 25.00,
    isActive: true,
  },
];

module.exports = sampleBudgets;

