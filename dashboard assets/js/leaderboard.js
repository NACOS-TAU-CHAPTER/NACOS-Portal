import { getTopCandidates } from '../../dashboard assets/js/voting_results.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;

    // List of all categories to fetch results for
    const categories = [
        { id: 'tech-innovator', name: 'Tech Innovator of the Year' },
        { id: 'faculty-icon', name: 'Faculty Icon of the Year' },
        { id: 'sportsman', name: 'Sportsman of the Year' },
        { id: 'course-rep', name: 'Best Course Representative' },
        { id: 'best-dressed-male', name: 'Best Dressed Male' },
        { id: 'best-dressed-female', name: 'Best Dressed Female' },
        { id: 'best-lecturer', name: 'Best Lecturer' },
        { id: 'most-influential', name: 'Most Influential' },
        { id: 'outstanding-executive', name: 'Outstanding Executive' },
        { id: 'most-popular', name: 'Most Popular Figure' }
    ];

    // Display a loading state initially
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;"></div>
            <p class="mt-3 fw-bold text-muted">Calculating real-time results...</p>
        </div>
    `;

    let htmlContent = '<div class="row g-4">';

    // Fetch results for each category and build the HTML layout
    for (const category of categories) {
        const topCandidates = await getTopCandidates(category.id);
        
        htmlContent += `
        <div class="col-lg-6 col-md-12">
            <div class="card shadow-sm h-100 border-0" style="border-radius: 15px; overflow: hidden;">
                <div class="card-header text-white" style="background-color: #1b8c0c;">
                    <h4 class="h5 mb-0 py-1 text-center">${category.name}</h4>
                </div>
                <div class="card-body bg-light">
                    ${topCandidates.length > 0 ? `
                    <ol class="list-group list-group-numbered list-group-flush" style="border-radius: 10px;">
                        ${topCandidates.map(candidate => `
                            <li class="list-group-item d-flex justify-content-between align-items-start bg-transparent">
                                <div class="ms-2 me-auto fw-bold text-dark">${candidate.candidate_name}</div>
                                <span class="badge rounded-pill" style="background-color: #1b8c0c;">${candidate.votes} Votes</span>
                            </li>
                        `).join('')}
                    </ol>
                    ` : '<p class="text-muted text-center mb-0 my-3"><em>No votes cast yet for this category.</em></p>'}
                </div>
            </div>
        </div>`;
    }

    htmlContent += '</div>';
    container.innerHTML = htmlContent;
});
