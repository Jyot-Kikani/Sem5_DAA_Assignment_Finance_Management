# Smart Personal Finance Manager

A web-based tool that applies classic optimization and graph algorithms to help users make smarter, unbiased financial decisions. This project demonstrates how Dynamic Programming and Greedy algorithms can be used to solve complex, real-world problems in personal finance.

---

## Core Features

The application is built as a single-page application with three distinct modules:

### 1. Optimal Monthly Budget Planner
-   **Problem:** Users often overspend on low-priority items while neglecting essentials.
-   **Algorithm:** Implements the **0/1 Knapsack (Dynamic Programming)** algorithm.
-   **How it Works:** Treats the monthly budget as the "knapsack capacity," expenses as "items" with a cost ("weight"), and user-defined priorities as the "value." The algorithm selects the combination of expenses that maximizes the total priority score without exceeding the budget.
-   **Output:** A clear comparison between the user's manual budget and the optimized plan, highlighting savings.

 <!-- Placeholder for actual screenshot -->

### 2. Group Expense Debt Simplifier
-   **Problem:** In group spending scenarios (trips, roommates), tracking who owes whom becomes a complex web of transactions.
-   **Algorithm:** Implements the **Min-Cash-Flow (Greedy Graph Optimization)** algorithm.
-   **How it Works:** Models each person as a node in a graph. It calculates each person's net balance (credit or debit) and then repeatedly settles debts by matching the person who owes the most with the person who is owed the most. This drastically reduces the number of required transactions.
-   **Output:** An interactive "before" and "after" graph visualization powered by **D3.js**, showing the simplification, along with a minimal list of transactions to settle all debts.

 <!-- Placeholder for actual screenshot -->

### 3. Savings Goal Planner
-   **Problem:** Users struggle to allocate a fixed monthly saving amount across multiple financial goals with different deadlines and target amounts.
-   **Algorithms:** Implements and compares two classic strategies:
    1.  **Greedy (Earliest Deadline First):** Prioritizes funding goals that are due the soonest.
    2.  **Value Maximization (Largest Goal First):** A simplified DP-like approach that prioritizes funding the most expensive goals first.
-   **Output:** A side-by-side comparison of the two strategies, showing the timeline for achieving goals and highlighting potential missed deadlines, allowing the user to choose the plan that best fits their personal priorities.

---

## 🛠️ Technology Stack

-   **Frontend:** Vanilla HTML5, CSS3, and JavaScript (ES6 Modules). No frameworks were used to keep the focus on the algorithms.
-   **Visualization:** **D3.js (v7)** for creating the dynamic, force-directed graphs in the Debt Simplifier.
-   **Design:**
    -   Modern, responsive UI with a beige and pastel green color scheme.
    -   Custom-styled components with a focus on user experience.
    -   **Google Fonts** (`Poppins` for headings, `Lato` for body text).
-   **Core Concepts:**
    -   Dynamic Programming
    -   Greedy Algorithms
    -   Graph Theory & Optimization

---

## How to Use

Here are some examples to test the core features:

### Demonstrating the Budget Optimizer
1.  Set **Total Monthly Budget** to `1200`.
2.  Add the following expenses:
    -   `Rent` | Amount: `500` | Priority: `10`
    -   `Groceries` | Amount: `250` | Priority: `10`
    -   `Internet` | Amount: `60` | Priority: `8`
    -   `Eating Out` | Amount: `120` | Priority: `5`
    -   `Streaming` | Amount: `15` | Priority: `4`
    -   `New Video Game` | Amount: `60` | Priority: `2`
3.  Click **"Optimize My Budget"**. Observe how the algorithm drops the "New Video Game" and "Streaming" to stay within budget while keeping higher-priority items.

### Demonstrating the Debt Simplifier
1.  Add three members: `Alice`, `Bob`, and `Carol`.
2.  Add a transaction: **Alice** paid `30` for a meal split among `Alice`, `Bob`, and `Carol`. The "Original Debts" graph will show Bob and Carol each owing Alice $10.
3.  Add another transaction: **Bob** paid `20` for coffee split between `Bob` and `Carol`. The graph will update to show Carol also owing Bob $10.
4.  Click **"Simplify Debts"**. The "Simplified Payouts" graph will show the optimal solution: **Carol pays Alice $10, and Carol pays Bob $10**. The redundant transaction between Bob and Alice is eliminated.

---

## Future Improvements

-   **User Accounts:** Implement a backend (e.g., Node.js, Firebase) to allow users to save their financial data.
-   **More Algorithms:** Introduce other strategies, such as the Fractional Knapsack for the budget planner or different sorting criteria for the savings planner.
-   **Advanced Visualizations:** Use more chart types (pie charts, timelines) to represent data.
-   **Data Export:** Allow users to export their optimized plans as a CSV or PDF file.
