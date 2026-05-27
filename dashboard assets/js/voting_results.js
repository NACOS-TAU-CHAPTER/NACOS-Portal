import { supabase } from '../../assets/js/supabase-config.js';

/**
 * Fetches and tallies the top 10 candidates for a given category.
 * @param {string} category - The category ID (e.g., 'tech-innovator')
 * @returns {Promise<Array>} Array of candidate objects sorted by most votes
 */
export async function getTopCandidates(category) {
    const { data, error } = await supabase
        .from('votes')
        .select('candidate_name, vote_amount')
        .eq('category', category);

    if (error) {
        console.error('Error fetching votes:', error);
        return [];
    }

    const voteCounts = {};
    data.forEach(vote => {
        voteCounts[vote.candidate_name] = (voteCounts[vote.candidate_name] || 0) + (vote.vote_amount || 1);
    });

    return Object.entries(voteCounts)
        .map(([name, votes]) => ({ candidate_name: name, votes }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 10);
}
