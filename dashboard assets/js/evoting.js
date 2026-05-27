import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const votingForm = document.getElementById('evoting-form');

    if (votingForm) {
        votingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Check if the user is authenticated via Supabase Auth
            const { data: { session }, error: authError } = await supabase.auth.getSession();
            
            if (authError || !session) {
                Swal.fire({
                    title: "Authentication Required",
                    text: "You must be logged in to cast your vote.",
                    icon: "warning",
                    confirmButtonText: "Log In"
                }).then(() => {
                    window.location.href = "signin.html";
                });
                return;
            }

            // Show loading state
            Swal.fire({
                title: 'Submitting Votes...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // 2. Gather votes from the form
            const formData = new FormData(votingForm);
            const votesToInsert = [];
            const voterId = session.user.id;
            let totalVotes = 0;
            const COST_PER_VOTE = 100; // Define your price per vote here

            // List of all categories matching your form input names
            const categories = [
                'tech-innovator',
                'faculty-icon',
                'sportsman',
                'course-rep',
                'best-dressed-male',
                'best-dressed-female',
                'best-lecturer',
                'most-influential',
                'outstanding-executive',
                'most-popular'
            ];

            // 3. Loop through categories and prepare the payload
            categories.forEach(category => {
                const candidate = formData.get(category);
                
                // Check for the amount field (e.g., 'tech-innovator-amount')
                const amountRaw = formData.get(`${category}-amount`);
                const voteAmount = amountRaw ? parseInt(amountRaw, 10) : 1;
                
                if (candidate && candidate.trim() !== '' && voteAmount > 0) {
                    totalVotes += voteAmount;
                    votesToInsert.push({
                        category: category,
                        candidate_name: candidate.trim(),
                        vote_amount: voteAmount,
                        voter_id: voterId
                    });
                }
            });

            if (votesToInsert.length === 0) {
                Swal.fire("No Selection", "Please select at least one candidate before voting.", "info");
                return;
            }

            // 4. Open Paystack
            const amountInKobo = totalVotes * COST_PER_VOTE * 100;
            
            let handler = PaystackPop.setup({
                key: 'pk_test_cec017fdc34dde2d47e7c3df9429637df74c6939', // Replace with your Paystack Public Key
                email: session.user.email,
                amount: amountInKobo,
                currency: 'NGN',
                ref: 'NACOS_VOTE_' + Math.floor((Math.random() * 1000000000) + 1),
                metadata: {
                    votes: JSON.stringify(votesToInsert),
                    voterId: voterId
                },
                callback: async function(response) {
                    Swal.fire({ title: 'Verifying Payment...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
                    
                    try {
                        // 5. Send reference to secure backend for verification and insertion
                        const res = await fetch('/.netlify/functions/submit-votes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reference: response.reference, votes: votesToInsert, voterId: voterId })
                        });
                        const data = await res.json();
                        
                        if (res.ok) {
                            Swal.fire("Success!", "Payment verified and votes successfully recorded.", "success");
                            votingForm.reset();
                        } else {
                            Swal.fire("Error", data.error || "Verification failed", "error");
                        }
                    } catch (err) {
                        Swal.fire("Error", "Network error during verification", "error");
                    }
                },
                onClose: function() {
                    Swal.fire("Cancelled", "Payment was cancelled.", "info");
                }
            });
            handler.openIframe();
        });
    }
});
