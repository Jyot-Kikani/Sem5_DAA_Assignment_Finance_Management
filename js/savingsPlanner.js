export function initSavingsPlanner() {
    const goalForm = document.getElementById('goal-form');
    const goalList = document.getElementById('goal-list');
    const planBtn = document.getElementById('plan-savings');
    const resultsDiv = document.getElementById('savings-results');
    const monthlySavingsInput = document.getElementById('monthly-savings');

    let goals = [];

    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('goal-name').value;
        const amount = parseInt(document.getElementById('goal-amount').value);
        const deadline = document.getElementById('goal-deadline').value;

        if (name && amount > 0 && deadline) {
            goals.push({ name, amount, deadline: new Date(deadline) });
            renderGoals();
            goalForm.reset();
        }
    });
    
    goalList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const index = parseInt(e.target.dataset.index);
            goals.splice(index, 1);
            renderGoals();
        }
    });

    planBtn.addEventListener('click', generatePlans);

    function renderGoals() {
        goalList.innerHTML = '';
        goals.forEach((goal, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${goal.name} - $${goal.amount} (by ${goal.deadline.toLocaleDateString()})</span>
                <button data-index="${index}">Remove</button>
            `;
            goalList.appendChild(li);
        });
    }

    function generatePlans() {
        const monthlySavings = parseInt(monthlySavingsInput.value);
        if (isNaN(monthlySavings) || monthlySavings <= 0) {
            alert('Please enter a valid monthly savings amount.');
            return;
        }

        resultsDiv.innerHTML = ''; // Clear previous results

        // Strategy 1: Greedy (Earliest Deadline First)
        const greedyPlan = earliestDeadlineFirst(goals, monthlySavings);
        displayPlan('Greedy Strategy (Earliest Deadline First)', greedyPlan);

        // Strategy 2: Simplified DP (Highest Priority/Value first - here simplified to largest amount)
        const valuePlan = highestValueFirst(goals, monthlySavings);
        displayPlan('Value Maximization Strategy (Largest Goal First)', valuePlan);
    }
    
    function earliestDeadlineFirst(goals, monthlySavings) {
        const sortedGoals = [...goals].sort((a, b) => a.deadline - b.deadline);
        return calculateTimeline(sortedGoals, monthlySavings);
    }

    function highestValueFirst(goals, monthlySavings) {
        const sortedGoals = [...goals].sort((a, b) => b.amount - a.amount);
        return calculateTimeline(sortedGoals, monthlySavings);
    }

    function calculateTimeline(sortedGoals, monthlySavings) {
        let timeline = [];
        let savingsPool = 0;
        let months = 0;
        let goalIndex = 0;

        while (goalIndex < sortedGoals.length) {
            months++;
            savingsPool += monthlySavings;
            const currentGoal = sortedGoals[goalIndex];
            
            if (savingsPool >= currentGoal.amount) {
                savingsPool -= currentGoal.amount;
                timeline.push({ 
                    goalName: currentGoal.name, 
                    completedIn: months,
                    deadline: currentGoal.deadline
                });
                goalIndex++;
            }
        }
        return timeline;
    }

    function displayPlan(title, timeline) {
        const container = document.createElement('div');
        container.innerHTML = `<h4>${title}</h4>`;
        const list = document.createElement('ul');
        
        if (timeline.length === 0) {
            list.innerHTML = '<li>Not enough savings to achieve any goal with this strategy.</li>';
        } else {
            timeline.forEach(item => {
                const li = document.createElement('li');
                const months = item.completedIn;
                const years = Math.floor(months / 12);
                const remainingMonths = months % 12;
                let timeText = '';
                if (years > 0) timeText += `${years} year(s) `;
                if (remainingMonths > 0) timeText += `${remainingMonths} month(s)`;
                
                li.textContent = `${item.goalName} achieved in ~${timeText.trim()}`;
                
                const completionDate = new Date();
                completionDate.setMonth(completionDate.getMonth() + months);

                if (completionDate > item.deadline) {
                    li.innerHTML += ' <strong style="color: #c0392b;">(Deadline Missed)</strong>';
                } else {
                     li.innerHTML += ' <span style="color: #27ae60;">(On Track)</span>';
                }

                list.appendChild(li);
            });
        }
        container.appendChild(list);
        resultsDiv.appendChild(container);
    }
}