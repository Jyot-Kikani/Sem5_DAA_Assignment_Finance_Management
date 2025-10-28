export function initBudgetPlanner() {
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const calculateBtn = document.getElementById('calculate-budget');
    const resultsDiv = document.getElementById('budget-results');
    const totalBudgetInput = document.getElementById('total-budget');

    let expenses = [];

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('expense-name').value;
        const amount = parseInt(document.getElementById('expense-amount').value);
        const priority = parseInt(document.getElementById('expense-priority').value);

        if (name && amount > 0 && priority > 0) {
            expenses.push({ name, amount, priority });
            renderExpenses();
            expenseForm.reset();
        }
    });

    function renderExpenses() {
        expenseList.innerHTML = '';
        expenses.forEach((exp, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${exp.name} - ₹${exp.amount} (Priority: ${exp.priority})</span>
                <button data-index="${index}">Remove</button>
            `;
            expenseList.appendChild(li);
        });
    }

    expenseList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const index = parseInt(e.target.dataset.index);
            expenses.splice(index, 1);
            renderExpenses();
        }
    });
    
    calculateBtn.addEventListener('click', () => {
        const totalBudget = parseInt(totalBudgetInput.value);
        if (isNaN(totalBudget) || totalBudget <= 0) {
            alert('Please enter a valid total budget.');
            return;
        }

        const { selectedExpenses, totalCost, totalPriority } = knapsack(expenses, totalBudget);
        displayResults(selectedExpenses, totalCost, totalPriority, totalBudget);
    });

    function knapsack(items, capacity) {
        const n = items.length;
        const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));

        for (let i = 1; i <= n; i++) {
            const { amount, priority } = items[i - 1];
            for (let w = 1; w <= capacity; w++) {
                if (amount <= w) {
                    dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - amount] + priority);
                } else {
                    dp[i][w] = dp[i - 1][w];
                }
            }
        }
        
        // Backtrack to find selected items
        let selectedExpenses = [];
        let w = capacity;
        let totalCost = 0;
        for (let i = n; i > 0 && dp[i][w] > 0; i--) {
            if (dp[i][w] !== dp[i - 1][w]) {
                const item = items[i - 1];
                selectedExpenses.push(item);
                w -= item.amount;
                totalCost += item.amount;
            }
        }
        
        return { selectedExpenses: selectedExpenses.reverse(), totalCost, totalPriority: dp[n][capacity] };
    }

    function displayResults(selected, cost, priority, budget) {
        resultsDiv.innerHTML = `
            <h3>Your Optimized Budget</h3>
            <p><strong>Total Spent:</strong> ₹${cost} / ₹${budget}</p>
            <p><strong>Total Priority Score:</strong> ${priority}</p>
            <p><strong>Savings:</strong> ₹${budget - cost}</p>
            <h4>Included Expenses:</h4>
        `;
        const includedList = document.createElement('ul');
        selected.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} - ₹${item.amount} (Priority: ${item.priority})`;
            includedList.appendChild(li);
        });
        resultsDiv.appendChild(includedList);

        const excluded = expenses.filter(exp => !selected.some(sel => sel.name === exp.name));
        if (excluded.length > 0) {
            const excludedTitle = document.createElement('h4');
            excludedTitle.textContent = 'Excluded Expenses:';
            resultsDiv.appendChild(excludedTitle);
            const excludedList = document.createElement('ul');
            excluded.forEach(item => {
                const li = document.createElement('li');
                li.style.color = '#777';
                li.textContent = `${item.name} - ₹${item.amount} (Priority: ${item.priority})`;
                excludedList.appendChild(li);
            });
            resultsDiv.appendChild(excludedList);
        }
    }
}