import { initBudgetPlanner } from './budgetPlanner.js';
import { initDebtSimplifier } from './debtSimplifier.js';
import { initSavingsPlanner } from './savingsPlanner.js';

document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navButtons = {
        budget: document.getElementById('nav-budget'),
        debt: document.getElementById('nav-debt'),
        savings: document.getElementById('nav-savings'),
    };

    const sections = {
        budget: document.getElementById('budget-planner'),
        debt: document.getElementById('debt-simplifier'),
        savings: document.getElementById('savings-planner'),
    };

    function showSection(sectionKey) {
        // Hide all sections
        Object.values(sections).forEach(section => section.classList.add('hidden'));
        // Deactivate all nav buttons
        Object.values(navButtons).forEach(button => button.classList.remove('active'));

        // Show the target section and activate its button
        sections[sectionKey].classList.remove('hidden');
        navButtons[sectionKey].classList.add('active');
    }

    navButtons.budget.addEventListener('click', () => showSection('budget'));
    navButtons.debt.addEventListener('click', () => showSection('debt'));
    navButtons.savings.addEventListener('click', () => showSection('savings'));
    
    // Initialize all feature modules
    initBudgetPlanner();
    initDebtSimplifier();
    initSavingsPlanner();

    // Show the default section on load
    showSection('budget');
});