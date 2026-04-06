// State Management
let currentUser = {
    name: '',
    mobile: '',
    email: ''
};

let currentQuestionIndex = 0;
let userAnswers = new Array(25).fill(null);
let timeLeft = 25 * 60; // 25 minutes in seconds
let timerInterval;

// DOM Elements
const landingPage = document.getElementById('landing-page');
const userFormSection = document.getElementById('user-form-section');
const testSection = document.getElementById('test-section');
const resultPage = document.getElementById('result-page');

const startBtn = document.getElementById('start-btn');
const userInfoForm = document.getElementById('user-info-form');
const questionNumberTitle = document.getElementById('question-number-title');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const questionCategory = document.getElementById('question-category');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitTestBtn = document.getElementById('submit-test-btn');

// 1. Navigation Logic
if (startBtn) {
    startBtn.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        userFormSection.classList.remove('hidden');
    });
}

if (userInfoForm) {
    userInfoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('full-name').value.trim();
        const mobile = document.getElementById('mobile-number').value.trim();
        const email = document.getElementById('email-address').value.trim();
        
        // Validation
        let isValid = true;
        if (!name) {
            document.getElementById('name-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('name-error').style.display = 'none';
        }
        
        if (!/^\d{10}$/.test(mobile)) {
            document.getElementById('mobile-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('mobile-error').style.display = 'none';
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('email-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('email-error').style.display = 'none';
        }
        
        if (isValid) {
            currentUser = { name, mobile, email };
            startTest();
        }
    });
}

// 2. Test Logic
function startTest() {
    userFormSection.classList.add('hidden');
    testSection.classList.remove('hidden');
    loadQuestion();
    startTimer();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitTest();
        }
    }, 1000);
}

function loadQuestion() {
    const q = window.aptitudeQuestions[currentQuestionIndex];
    questionNumberTitle.textContent = `Question ${currentQuestionIndex + 1} of 25`;
    questionCategory.textContent = q.category;
    questionText.textContent = q.question;
    
    // Update Progress Bar
    const progress = ((currentQuestionIndex + 1) / 25) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Render Options
    optionsContainer.innerHTML = '';
    q.options.forEach((option, index) => {
        const optionItem = document.createElement('div');
        optionItem.className = `option-item ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}`;
        optionItem.innerHTML = `
            <input type="radio" name="option" class="option-radio" ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
            <span>${option}</span>
        `;
        optionItem.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionItem);
    });
    
    // Update Buttons
    prevBtn.disabled = currentQuestionIndex === 0;
    if (currentQuestionIndex === 24) {
        nextBtn.classList.add('hidden');
        submitTestBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitTestBtn.classList.add('hidden');
    }
}

function selectOption(index) {
    userAnswers[currentQuestionIndex] = index;
    const items = optionsContainer.querySelectorAll('.option-item');
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === index);
        item.querySelector('input').checked = i === index;
    });
}

if (prevBtn) {
    prevBtn.onclick = () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
        }
    };
}

if (nextBtn) {
    nextBtn.onclick = () => {
        if (currentQuestionIndex < 24) {
            currentQuestionIndex++;
            loadQuestion();
        }
    };
}

if (submitTestBtn) {
    submitTestBtn.onclick = () => {
        if (confirm('Are you sure you want to submit the test?')) {
            submitTest();
        }
    };
}

// 3. Scoring and Submission
async function submitTest() {
    clearInterval(timerInterval);
    
    let score = 0;
    window.aptitudeQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.answer) {
            score++;
        }
    });
    
    const percentage = (score / 25) * 100;
    let message = '';
    if (percentage >= 80) message = 'Excellent';
    else if (percentage >= 60) message = 'Good';
    else if (percentage >= 40) message = 'Average';
    else message = 'Needs Improvement';
    
    // Show Result Page
    testSection.classList.add('hidden');
    resultPage.classList.remove('hidden');
    
    document.getElementById('display-name').textContent = currentUser.name;
    document.getElementById('final-score').textContent = score;
    document.getElementById('correct-count').textContent = score;
    document.getElementById('final-percentage').textContent = `${percentage}%`;
    document.getElementById('result-message').textContent = message;
    
    // Save to Supabase
    try {
        const { data, error } = await window.supabaseClient
            .from('test_results')
            .insert([
                {
                    name: currentUser.name,
                    mobile: currentUser.mobile,
                    email: currentUser.email,
                    score: score,
                    total_questions: 25,
                    percentage: percentage,
                    submitted_at: new Date().toISOString()
                }
            ]);
            
        if (error) throw error;
        console.log('Result saved successfully');
    } catch (err) {
        console.error('Error saving result:', err.message);
        alert('Test completed, but there was an error saving your result to the database. Please ensure your Supabase URL and Key are correctly configured in supabase.js.');
    }
}
