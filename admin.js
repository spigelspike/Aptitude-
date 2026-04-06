// Admin Credentials
const ADMIN_USER = 'admin';
const ADMIN_MOBILE = '0000000009';

// State
let allResults = [];
let filteredResults = [];

// DOM Elements
const loginSection = document.getElementById('admin-login-section');
const dashboardSection = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error');
const tableBody = document.getElementById('table-body');
const totalParticipants = document.getElementById('total-participants');
const avgScoreDisplay = document.getElementById('avg-score');
const searchInput = document.getElementById('search-input');
const scoreFilter = document.getElementById('score-filter');
const exportBtn = document.getElementById('export-csv-btn');
const logoutBtn = document.getElementById('logout-btn');

// 1. Admin Login
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const mobile = document.getElementById('admin-mobile').value;

        if (username === ADMIN_USER && mobile === ADMIN_MOBILE) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            fetchResults();
        } else {
            loginError.style.display = 'block';
        }
    });
}

if (logoutBtn) {
    logoutBtn.onclick = () => {
        location.reload();
    };
}

// 2. Data Fetching
async function fetchResults() {
    try {
        const { data, error } = await window.supabaseClient
            .from('test_results')
            .select('*')
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        allResults = data || [];
        filteredResults = [...allResults];
        renderDashboard();
    } catch (err) {
        console.error('Error fetching results:', err.message);
        alert('Error fetching data from Supabase. Please check your configuration in supabase.js.');
    }
}

// 3. Dashboard Rendering
function renderDashboard() {
    // Update Stats
    if (totalParticipants) totalParticipants.textContent = filteredResults.length;
    
    if (avgScoreDisplay) {
        if (filteredResults.length > 0) {
            const totalScore = filteredResults.reduce((sum, res) => sum + (res.percentage || 0), 0);
            avgScoreDisplay.textContent = `${(totalScore / filteredResults.length).toFixed(1)}%`;
        } else {
            avgScoreDisplay.textContent = '0%';
        }
    }

    // Render Table
    if (tableBody) {
        tableBody.innerHTML = '';
        filteredResults.forEach(res => {
            const date = new Date(res.submitted_at).toLocaleString();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${res.name}</td>
                <td>${res.email}</td>
                <td>${res.mobile}</td>
                <td>${res.score}/25</td>
                <td>${res.percentage}%</td>
                <td>${date}</td>
                <td>
                    <button class="action-btn" onclick="deleteRecord('${res.id}')" title="Delete">
                        🗑️
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// 4. Search and Filter
if (searchInput) searchInput.addEventListener('input', applyFilters);
if (scoreFilter) scoreFilter.addEventListener('change', applyFilters);

function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filterValue = scoreFilter ? scoreFilter.value : 'all';

    filteredResults = allResults.filter(res => {
        const matchesSearch = (res.name || '').toLowerCase().includes(searchTerm) || 
                             (res.mobile || '').includes(searchTerm);
        
        let matchesFilter = true;
        if (filterValue === 'excellent') matchesFilter = res.percentage >= 80;
        else if (filterValue === 'good') matchesFilter = res.percentage >= 60 && res.percentage < 80;
        else if (filterValue === 'average') matchesFilter = res.percentage >= 40 && res.percentage < 60;
        else if (filterValue === 'poor') matchesFilter = res.percentage < 40;

        return matchesSearch && matchesFilter;
    });

    renderDashboard();
}

// 5. Delete Record
async function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        try {
            const { error } = await window.supabaseClient
                .from('test_results')
                .delete()
                .eq('id', id);

            if (error) throw error;

            allResults = allResults.filter(res => res.id !== id);
            applyFilters();
        } catch (err) {
            console.error('Error deleting record:', err.message);
            alert('Failed to delete record.');
        }
    }
}

// 6. Export CSV
if (exportBtn) {
    exportBtn.onclick = () => {
        if (filteredResults.length === 0) return alert('No data to export');

        const headers = ['Name', 'Email', 'Mobile', 'Score', 'Percentage', 'Submitted At'];
        const csvRows = [
            headers.join(','),
            ...filteredResults.map(res => [
                `"${res.name}"`,
                res.email,
                res.mobile,
                res.score,
                `${res.percentage}%`,
                new Date(res.submitted_at).toLocaleString()
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'aptitude_results.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

// Expose deleteRecord to global scope for onclick
window.deleteRecord = deleteRecord;
