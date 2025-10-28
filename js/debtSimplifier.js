export function initDebtSimplifier() {
    const memberForm = document.getElementById('member-form');
    const transactionForm = document.getElementById('transaction-form');
    const memberList = document.getElementById('member-list');
    const paidBySelect = document.getElementById('paid-by-select');
    const splitBetweenDiv = document.getElementById('split-between-members');
    const simplifyBtn = document.getElementById('simplify-debts');
    
    const beforeGraphSvg = document.getElementById('before-graph');
    const afterGraphSvg = document.getElementById('after-graph');
    const afterList = document.querySelector('#after-simplification ul');

    let members = [];
    let transactions = []; // Stores { paidBy, amount, splitAmong }

    memberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('member-name');
        if (nameInput.value && !members.includes(nameInput.value)) {
            members.push(nameInput.value);
            nameInput.value = '';
            renderMembers();
        }
    });

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const paidBy = paidBySelect.value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const splitAmong = Array.from(splitBetweenDiv.querySelectorAll('input:checked')).map(cb => cb.value);

        if (paidBy && amount > 0 && splitAmong.length > 0) {
            transactions.push({ paidBy, amount, splitAmong });
            transactionForm.reset();
            renderMembers(); // Re-render to reset checkboxes

            updateBeforeGraph(); 
        }
    });
    
    simplifyBtn.addEventListener('click', simplifyDebts);

    function renderMembers() {
        memberList.innerHTML = '';
        paidBySelect.innerHTML = '';
        splitBetweenDiv.innerHTML = '';
        
        members.forEach(member => {
            const li = document.createElement('li'); li.textContent = member; memberList.appendChild(li);
            const option = document.createElement('option'); option.value = option.textContent = member; paidBySelect.appendChild(option);
            const label = document.createElement('label'); label.innerHTML = `<input type="checkbox" value="${member}" checked> ${member}`; splitBetweenDiv.appendChild(label);
        });
    }

    function updateBeforeGraph() {
        const debtMap = new Map(); // Use a map to aggregate debts

        transactions.forEach(({ paidBy, amount, splitAmong }) => {
            const share = amount / splitAmong.length;
            splitAmong.forEach(debtor => {
                if (debtor !== paidBy) {
                    const key = `${debtor}->${paidBy}`; // Unique key for a debt direction
                    const reverseKey = `${paidBy}->${debtor}`;

                    // If a reverse debt exists, try to cancel it out first
                    if (debtMap.has(reverseKey)) {
                        const reverseAmount = debtMap.get(reverseKey);
                        if (reverseAmount > share) {
                            debtMap.set(reverseKey, reverseAmount - share);
                        } else {
                            debtMap.delete(reverseKey);
                            if (share > reverseAmount) {
                                debtMap.set(key, (debtMap.get(key) || 0) + share - reverseAmount);
                            }
                        }
                    } else {
                        debtMap.set(key, (debtMap.get(key) || 0) + share);
                    }
                }
            });
        });
        
        const initialDebts = Array.from(debtMap.entries()).map(([key, amount]) => {
            const [from, to] = key.split('->');
            return { from, to, amount };
        });

        renderGraph(beforeGraphSvg, members, initialDebts);
    }


    function simplifyDebts() {
        if (members.length === 0 || transactions.length === 0) {
            alert('Please add members and transactions first.');
            return;
        }
        
        // Ensure the "before" graph is up-to-date
        updateBeforeGraph();
        
        // Calculate and Render "After" Graph & List
        const netBalance = new Map(members.map(m => [m, 0]));
        transactions.forEach(({ paidBy, amount, splitAmong }) => {
            const share = amount / splitAmong.length;
            netBalance.set(paidBy, netBalance.get(paidBy) + amount);
            splitAmong.forEach(member => {
                netBalance.set(member, netBalance.get(member) - share);
            });
        });

        const simplifiedTransactions = getMinTransactions(netBalance);
        renderGraph(afterGraphSvg, members, simplifiedTransactions);

        // Render "After" List
        afterList.innerHTML = '';
        if (simplifiedTransactions.length === 0) {
            afterList.innerHTML = '<li>All debts are settled!</li>';
            return;
        }
        simplifiedTransactions.forEach(({ from, to, amount }) => {
            const li = document.createElement('li');
            li.textContent = `${from} pays ₹${amount.toFixed(2)} to ${to}`;
            afterList.appendChild(li);
        });
    }

    function getMinTransactions(netBalance) {
        const debtors = Array.from(netBalance.entries()).filter(([, amount]) => amount < 0).map(([person, amount]) => ({ person, amount: -amount }));
        const creditors = Array.from(netBalance.entries()).filter(([, amount]) => amount > 0).map(([person, amount]) => ({ person, amount }));

        const settlements = [];
        
        while (debtors.length > 0 && creditors.length > 0) {
            debtors.sort((a,b) => a.amount - b.amount); // Sort to handle small amounts
            creditors.sort((a,b) => a.amount - b.amount);
            
            const maxDebtor = debtors[debtors.length - 1];
            const maxCreditor = creditors[creditors.length - 1];
            
            const settlementAmount = Math.min(maxDebtor.amount, maxCreditor.amount);
            
            if(settlementAmount < 0.01) break; // Avoid tiny floating point transactions

            settlements.push({ from: maxDebtor.person, to: maxCreditor.person, amount: settlementAmount });
            
            maxDebtor.amount -= settlementAmount;
            maxCreditor.amount -= settlementAmount;

            if (maxDebtor.amount < 0.01) debtors.pop();
            if (maxCreditor.amount < 0.01) creditors.pop();
        }
        return settlements;
    }

    function renderGraph(svgElement, members, debts) {
        // ... (The renderGraph function itself remains unchanged) ...
        svgElement.innerHTML = ''; // Clear previous render

        const width = svgElement.clientWidth;
        const height = svgElement.clientHeight;

        if (members.length === 0) return;

        const nodes = members.map(m => ({ id: m }));
        const links = debts.map(d => ({ source: d.from, target: d.to, amount: d.amount }));

        const svg = d3.select(svgElement).attr("viewBox", [0, 0, width, height]);

        svg.append("defs").append("marker")
            .attr("id", `arrowhead-${svgElement.id}`)
            .attr("viewBox", "-0 -5 10 10").attr("refX", 23).attr("refY", 0)
            .attr("orient", "auto").attr("markerWidth", 8).attr("markerHeight", 8)
            .append("svg:path").attr("d", "M 0,-5 L 10 ,0 L 0,5").attr("fill", "#999");

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-250))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g").attr("class", "links").selectAll("line")
            .data(links).enter().append("line")
            .attr("stroke-width", 2)
            .attr("marker-end", `url(#arrowhead-${svgElement.id})`);

        const linkLabel = svg.append("g").selectAll(".link-label")
            .data(links).enter().append("text")
            .attr("class", "link-label")
            .text(d => `₹${d.amount.toFixed(2)}`);

        const node = svg.append("g").attr("class", "nodes").selectAll("g")
            .data(nodes).enter().append("g");
        
        node.append("circle").attr("r", 15).attr("fill", "#3498db");
        node.append("text").text(d => d.id).attr("y", 25);
        node.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
            node.attr("transform", d => `translate(${d.x},${d.y})`);
            linkLabel.attr("x", d => (d.source.x + d.target.x) / 2)
                     .attr("y", d => (d.source.y + d.target.y) / 2);
        });

        function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
        function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
    }
}