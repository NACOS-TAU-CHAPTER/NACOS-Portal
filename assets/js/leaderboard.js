import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;

    // Show loading spinner
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;"></div>
            <p class="mt-3 fw-bold text-muted">Calculating live results...</p>
        </div>
    `;

    try {
        // Fetch all votes from Supabase
        const { data: votes, error } = await supabase
            .from('votes')
            .select('category, candidate_name, vote_amount');

        if (error) throw error;

        if (!votes || votes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-bar-chart text-muted" style="font-size: 5rem;"></i>
                    <h4 class="mt-3 fw-bold">No Votes Yet</h4>
                    <p class="text-muted">The leaderboard will automatically update as soon as the first vote is successfully cast.</p>
                </div>
            `;
            return;
        }

        // Aggregate votes per category and candidate
        const tally = {};
        votes.forEach(v => {
            if (!tally[v.category]) tally[v.category] = {};
            if (!tally[v.category][v.candidate_name]) tally[v.category][v.candidate_name] = 0;
            tally[v.category][v.candidate_name] += (v.vote_amount || 0);
        });

        // Helper to format category names (e.g., "tech-innovator" -> "Tech Innovator")
        const formatCategoryName = (cat) => {
            return cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        let html = '<div class="row g-4">';

        // Generate a card for each category
        Object.keys(tally).forEach(category => {
            // Sort candidates by highest votes
            const candidates = Object.entries(tally[category])
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            html += `
                <div class="col-lg-6 col-md-12" data-aos="fade-up">
                    <div class="card shadow-sm border-0 h-100 rounded-4">
                        <div class="card-header text-white rounded-top-4 py-3" style="background-color: #1b8c0c;">
                            <h5 class="mb-0 fw-bold"><i class="bi bi-trophy-fill me-2 text-warning"></i>${formatCategoryName(category)}</h5>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush rounded-bottom-4">
            `;

            // Generate list items for candidates
            candidates.forEach((c, index) => {
                let badgeClass = 'bg-secondary';
                if (index === 0) badgeClass = 'bg-warning text-dark'; // Gold for 1st
                else if (index === 1) badgeClass = 'bg-light text-dark border'; // Silver for 2nd
                else if (index === 2) badgeClass = 'bg-dark text-white'; // Bronze for 3rd

                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                        <div class="d-flex align-items-center">
                            <span class="badge ${badgeClass} rounded-pill me-3 shadow-sm" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px;">${index + 1}</span>
                            <span class="fw-bold text-dark" style="font-size: 16px;">${c.name}</span>
                        </div>
                        <span class="badge rounded-pill fs-6 px-3 py-2" style="background-color: #e8f5e9; color: #1b8c0c; border: 1px solid #1b8c0c;">
                            ${c.count} Vote${c.count !== 1 ? 's' : ''}
                        </span>
                    </li>
                `;
            });
            html += `</ul></div></div></div>`;
        });
        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        container.innerHTML = `<div class="alert alert-danger text-center rounded-4 p-4 shadow-sm">Failed to load the leaderboard results. Please try refreshing the page.</div>`;
    }
});