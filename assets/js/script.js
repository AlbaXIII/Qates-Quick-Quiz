class KateQuiz {
    constructor() {
        this.questions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.isAnswered = false;

        this.initaliseElements();
        this.bindEvents();
    }

    initaliseElements(){
        this.startScreen = document.getElementById('startScreen');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.errorScreen = document.getElementById('errorScreen');
        this.quizScreen = document.getElementById('quizScreen');
        this.resultsScreen = document.getElementById('resultsScreen');
                
        this.startBtn = document.getElementById('startBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.restartBtn = document.getElementById('restartBtn');
                
        this.progressFill = document.getElementById('progressFill');
        this.questionNumber = document.getElementById('questionNumber');
        this.questionText = document.getElementById('questionText');
        this.options = document.getElementById('options');
        this.errorMessage = document.getElementById('errorMessage');
        this.finalScore = document.getElementById('finalScore');
        this.scoreText = document.getElementById('scoreText');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startQuiz());
        this.retryBtn.addEventListener('click', () => this.startQuiz());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.restartBtn.addEventListener('click', () => this.restart());
    }

    async startQuiz() {
        this.startBtn.style.display = 'none';
        this.showScreen('loading');

        try {
            await this.fetchQuestions();
            this.currentQuestion = 0;
            this.score = 0;
            this.showQuestion();
            this.showScreen('quiz');
        } catch (error) {
            this.startBtn.style.display = 'inline-block';
            this.showError(error.message);
        }
    }

    async fetchQuestions() {
        const url = 'https://opentdb.com/api.php?amount=10&category=9&difficulty=medium&type=multiple';
        
        try {
            console.log('Fetching questions from API...');
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to grab questions! HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.response_code !== 0) {
                const errorMessages = {
                    1: 'No questions available right now :(',
                    2: 'Invalid request parameters',
                    3: 'Session token not found',
                    4: 'Session token expired'
                };
                throw new Error(errorMessages[data.response_code] || 'API error occurred');
            }

            if (!data.results || data.results.length === 0) {
                throw new Error('No questions received from API');
            }

            this.questions = data.results.map(q => ({
                question: this.decodeHtml(q.question),
                correct_answer: this.decodeHtml(q.correct_answer),
                incorrect_answers: q.incorrect_answers.map(a => this.decodeHtml(a)),
                all_answers: this.shuffleArray([
                    this.decodeHtml(q.correct_answer),
                    ...q.incorrect_answers.map(a => this.decodeHtml(a))
                ])
            }));
            
            console.log('Questions loaded successfully:', this.questions.length);
        } catch (error) {
            console.error('Fetch error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error - go kick the router and try again!');
            }
            throw new Error('Unable to load questions. Go kick the router.');
        }
    }

    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showQuestion() {
        const question = this.questions[this.currentQuestion];
        this.selectedAnswer = null;
        this.isAnswered = false;
                
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        this.progressFill.style.width = `${progress}%`;
                
        this.questionNumber.textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
        this.questionText.textContent = question.question;
                
        this.options.innerHTML = '';
        question.all_answers.forEach((answer, index) => {
            const option = document.createElement('div');
            option.className = 'option';
            option.textContent = answer;
            option.addEventListener('click', () => this.selectAnswer(answer, option));
            this.options.appendChild(option);
        });
                
        this.nextBtn.disabled = true;
        this.nextBtn.textContent = this.currentQuestion === this.questions.length - 1 ? 'View Results' : 'Next Question';
    }

    selectAnswer(answer, optionElement) {
        if (this.isAnswered) return;
        
        console.log('Answer selected:', answer);
                
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
                
        optionElement.classList.add('selected');
        this.selectedAnswer = answer;
        this.nextBtn.disabled = false;
        
        console.log('Selected answer set to:', this.selectedAnswer);
    }

    nextQuestion() {
        if (!this.selectedAnswer) return;
                
        this.isAnswered = true;
        const currentQ = this.questions[this.currentQuestion];
        const isCorrect = this.selectedAnswer === currentQ.correct_answer;
                
        if (isCorrect) {
            this.score++;
        }
                
        document.querySelectorAll('.option').forEach(option => {
            if (option.textContent === currentQ.correct_answer) {
                option.classList.add('correct');
            } else if (option.textContent === this.selectedAnswer && !isCorrect) {
                option.classList.add('incorrect');
            }
            option.style.pointerEvents = 'none';
        });
                
        setTimeout(() => {
            if (this.currentQuestion < this.questions.length - 1) {
                this.currentQuestion++;
                this.showQuestion();
            } else {
                this.showResults();
            }
        }, 1500);
    }

    showResults() {
        const percentage = Math.round((this.score / this.questions.length) * 100);
                
        this.finalScore.textContent = `${this.score}/${this.questions.length}`;
                
        let message, imagePath;
        if (percentage >= 90) {
            message = "Outstanding! You earned a premium Schmako!";
            imagePath = "assets/images/schmako.jpg";
        } else if (percentage >= 70) {
            message = "Great job! You got a pine marten!";
            imagePath = "assets/images/pine-marten.jpg";
        } else if (percentage >= 50) {
            message = "Meh. Have a Reggie";
            imagePath = "assets/images/grouper.jpg";
        } else {
            message = "You made the frog cry :(";
            imagePath = "assets/images/black-rain-frog.jpg";
        }
        
        // Create or update the result image
        let resultImage = document.getElementById('resultImage');
        if (!resultImage) {
            resultImage = document.createElement('img');
            resultImage.id = 'resultImage';
            resultImage.className = 'result-image';
            // Insert before the score text
            this.scoreText.parentNode.insertBefore(resultImage, this.scoreText);
        }
        
        resultImage.src = imagePath;
        resultImage.alt = message;
                
        this.scoreText.textContent = `${message}`;
        this.showScreen('results');
    }

    showScreen(screen) {
        console.log('Switching to screen:', screen);
        document.querySelectorAll('.startScreen, .loading, .error, .quiz-screen, .results-screen')
            .forEach(s => s.classList.add('hidden'));
                
        switch(screen) {
            case 'start':
                this.startScreen.classList.remove('hidden');
                break;
            case 'loading':
                this.loadingScreen.classList.remove('hidden');
                break;
            case 'error':
                this.errorScreen.classList.remove('hidden');
                break;
            case 'quiz':
                this.quizScreen.classList.remove('hidden');
                break;
            case 'results':
                this.resultsScreen.classList.remove('hidden');
                break;
            default:
                console.error('Unknown screen:', screen);
                this.startScreen.classList.remove('hidden');
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.showScreen('error');
    }

    restart() {
        this.startBtn.style.display = 'inline-block';
        this.showScreen('start');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KateQuiz();
});