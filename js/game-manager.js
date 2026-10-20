/**
 * Math Quest - Game Manager
 */

const GameManager = {
    currentGame: null,
    isPaused: false,
    timer: null,
    timeRemaining: 0,
    timerDeadline: 0,
    QUESTION_TIME: 30,

    initGame(grade, mode, questionsPerGame) {
        this.quit();
        this.currentGame = {
            grade,
            mode,
            questionsPerGame,
            category: MathEngine.currentCategory,
            questions: [],
            hintsUsed: [],
            currentQuestionIndex: 0,
            stats: {
                correct: 0,
                incorrect: 0,
                streak: 0,
                bestStreak: 0,
                startTime: Date.now(),
                points: 0,
                xp: 0,
                crystals: 0
            },
            results: {
                answers: []
            }
        };
        
        this.isPaused = false;
        this.timeRemaining = this.QUESTION_TIME;
        this.currentGame.questions = MathEngine.generateQuestions(questionsPerGame);
        this.currentGame.questionsPerGame = this.currentGame.questions.length;
    },

    initDiagnostic(questions) {
        if (!Array.isArray(questions) || questions.length !== 40) throw new Error('Expected 40 assessment questions');
        this.initGame(12, 'diagnostic', questions.length);
        this.currentGame.questions = questions;
        this.currentGame.questionsPerGame = questions.length;
    },

    initCheckpoint(grade,questions) {
        if(!Array.isArray(questions)||questions.length<20||questions.length>60)throw new Error('Invalid checkpoint question set');
        this.initGame(grade,'checkpoint',questions.length);
        this.currentGame.questions=questions;
        this.currentGame.questionsPerGame=questions.length;
    },

    startGame() {
        this.loadNextQuestion();
        return true;
    },

    loadNextQuestion() {
        if (this.currentGame.currentQuestionIndex >= this.currentGame.questions.length) {
            return null;
        }
        
        this.timeRemaining = this.QUESTION_TIME;
        return this.currentGame.questions[this.currentGame.currentQuestionIndex];
    },

    submitAnswer(answer, questionId = null) {
        if (!this.currentGame || this.currentGame.completed || this.isPaused) {
            return { accepted: false, error: 'Game is paused or finished' };
        }
        const question = this.currentGame.questions[this.currentGame.currentQuestionIndex];
        if (!question) return { accepted: false, error: 'No current question' };
        // Each displayed answer button is bound to exactly one question. A touch
        // click arriving after a timed advance must NEVER grade the next question.
        if (questionId !== null && questionId !== question.id) {
            return { accepted: false, error: 'This answer belongs to a previous question' };
        }
        const isTimed = this.currentGame.mode === 'timed';
        const attemptedAnswer = answer;
        // Compare the deadline with real elapsed time, not interval callback count.
        const timedOut = isTimed && (answer === null || answer === undefined ||
            (this.timerDeadline > 0 && Date.now() >= this.timerDeadline));
        if (isTimed && this.timerDeadline) {
            this.timeRemaining = Math.max(0, Math.ceil((this.timerDeadline - Date.now()) / 1000));
        }
        if (timedOut) answer = null;
        // Stop the clock before rendering feedback. It starts again only when
        // the player explicitly continues to the next question.
        if (isTimed) {
            if (this.timer) clearInterval(this.timer);
            this.timer = null;
            this.timerDeadline = 0;
        }
        const isCorrect = !timedOut && MathEngine.validateAnswer(question, answer);
        // Remember only actually presented questions; keep personal history bounded.
        const activeProfile = ProfileSystem.getCurrentProfile();
        if (activeProfile) {
            if (!Array.isArray(activeProfile.recentQuestionKeys)) activeProfile.recentQuestionKeys = [];
            const key = MathEngine.questionKey(question);
            activeProfile.recentQuestionKeys = [...activeProfile.recentQuestionKeys.filter(k => k !== key), key].slice(-250);
            SaveManager.save();
        }
        const timeRemaining = isTimed ? this.timeRemaining : 0;
        const points = MathEngine.calculatePoints(question, timeRemaining, isTimed, this.currentGame.stats.streak);

        this.currentGame.results.answers.push({
            questionId: question.id,
            question: question.text,
            key: MathEngine.questionKey(question),
            selected: timedOut ? '(Time expired)' : answer === null || answer === undefined ? '(No answer)' : String(answer),
            attempted: timedOut && attemptedAnswer !== null && attemptedAnswer !== undefined ? String(attemptedAnswer) : null,
            timedOut,
            expected: String(question.answer),
            explanation: question.explanation || question.hint || 'Review the underlying skill and solution method.',
            category: question.category,
            skill: question.skill,
            correct: isCorrect,
            time: isTimed ? this.QUESTION_TIME - this.timeRemaining : 0
        });

        if (isCorrect) {
            this.currentGame.stats.correct++;
            this.currentGame.stats.streak++;
            if (this.currentGame.stats.streak > this.currentGame.stats.bestStreak) {
                this.currentGame.stats.bestStreak = this.currentGame.stats.streak;
            }
            if (!['diagnostic','checkpoint'].includes(this.currentGame.mode)) this.currentGame.stats.points += points;
        } else {
            this.currentGame.stats.incorrect++;
            this.currentGame.stats.streak = 0;
        }

        this.currentGame.currentQuestionIndex++;
        // Each timed question gets its own full countdown.
        if (this.currentGame.currentQuestionIndex < this.currentGame.questions.length) {
            this.timeRemaining = this.QUESTION_TIME;
        }

        return {
            accepted: true,
            correct: isCorrect,
            timedOut,
            questionId: question.id,
            questionText: question.text,
            expected: question.answer,
            caseSensitive: Boolean(question.caseSensitive),
            selected: answer,
            explanation: question.explanation || question.hint || 'Review this skill and try a similar question.',
            points: isCorrect && !['diagnostic','checkpoint'].includes(this.currentGame.mode) ? points : 0,
            isLastQuestion: this.currentGame.currentQuestionIndex >= this.currentGame.questions.length
        };
    },

    endGame() {
        const game = this.currentGame;
        if (!game) return null;
        if (game.completed) return game.finalResults;
        game.completed = true;
        const isPerfect = game.stats.correct === game.questionsPerGame;
        
        // Calculate rewards
        // Tiny fixed-fact quizzes do not award farmable perfect-game bonuses.
        const isDiagnostic = game.mode === 'diagnostic' || game.mode === 'checkpoint';
        const bonusEligible = !isDiagnostic && game.questionsPerGame >= 5;
        let crystals = isPerfect && bonusEligible ? 2 : 0;
        let xp = isDiagnostic ? 0 : Math.floor(game.stats.points / 10);
        
        if (isPerfect && bonusEligible) xp += 50;
        if (!isDiagnostic && game.stats.bestStreak >= 10) crystals += 1;
        
        game.stats.xp = xp;
        game.stats.crystals = crystals;

        const advancement = isDiagnostic ? null : this.updateProfileStats(game.stats);
        const achievements = isDiagnostic ? [] : this.checkAchievements();
        if (typeof ReadinessLab !== 'undefined') ReadinessLab.recordGame(game, ProfileSystem.getCurrentProfile());
        game.finalResults = { stats: game.stats, results: game.results, isPerfect, achievements, advancement };
        return game.finalResults;
    },

    updateProfileStats(stats) {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return;

        profile.stats.totalQuestions += this.currentGame.questionsPerGame;
        profile.stats.correctAnswers += stats.correct;
        profile.stats.gamesPlayed++;
        
        if (stats.correct === this.currentGame.questionsPerGame) {
            profile.stats.perfectGames++;
        }
        
        if (stats.bestStreak > profile.stats.bestStreak) {
            profile.stats.bestStreak = stats.bestStreak;
        }
        
        profile.stats.points += stats.points;
        profile.stats.crystals += stats.crystals;
        // Only record breakdowns that we can prove from answered questions;
        // do not backfill unknown history for imported/older profiles.
        for (const [index, answer] of this.currentGame.results.answers.entries()) {
            const category = this.currentGame.questions[index].category;
            const entry = profile.categoryStats[category] ??= { totalQuestions: 0, correctAnswers: 0 };
            entry.totalQuestions++;
            if (answer.correct) entry.correctAnswers++;
        }
        const global = SaveManager.data.globalStats;
        global.totalQuestions += this.currentGame.questionsPerGame;
        global.correctAnswers += stats.correct;
        global.gamesPlayed++;
        if (stats.correct === this.currentGame.questionsPerGame) global.perfectGames++;
        // addXP() updates the balance and performs level advancement once.
        const advancement = ProfileSystem.addXP(stats.xp);
        SaveManager.save();
        return advancement;
    },

    checkAchievements() {
        const profile = ProfileSystem.getCurrentProfile();
        if (!profile) return [];

        const stats = {
            ...profile.stats,
            ...this.currentGame.stats,
            bestStreak: profile.stats.bestStreak,
            highestGradeUnlocked: Math.min(12, profile.stats.level + 1),
            perfect: this.currentGame.stats.correct === this.currentGame.questionsPerGame,
            gamesPlayed: profile.stats.gamesPlayed
        };

        return RewardSystem.checkAchievements(stats, {
            perfect: this.currentGame.stats.correct === this.currentGame.questionsPerGame
        });
    },

    pause() {
        if (!this.currentGame || this.currentGame.completed) return;
        if (this.currentGame.mode === 'timed' && this.timerDeadline) {
            this.timeRemaining = Math.max(0, Math.ceil((this.timerDeadline - Date.now()) / 1000));
        }
        this.isPaused = true;
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    },

    resume() {
        if (!this.currentGame || this.currentGame.completed) return;
        this.isPaused = false;
        if (this.currentGame.mode === 'timed' && !this.awaitingContinue) {
            this.startTimer();
        }
    },

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        if (!this.currentGame || this.currentGame.completed || this.awaitingContinue || this.currentGame.mode !== 'timed') return;
        this.isPaused = false;
        this.timerDeadline = Date.now() + this.timeRemaining * 1000;
        UIManager.updateTimerUI();
        this.timer = setInterval(() => {
            if (this.isPaused || !this.currentGame || this.currentGame.completed) return;
            this.timeRemaining = Math.max(0, Math.ceil((this.timerDeadline - Date.now()) / 1000));
            UIManager.updateTimerUI();
            if (this.timeRemaining === 0) {
                // Routes through normal scoring, advancing and results exactly once.
                const q = this.currentGame.questions[this.currentGame.currentQuestionIndex];
                if (q) UIManager.submitAnswer(null, q.id);
            }
        }, 200);
    },

    quit() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.timerDeadline = 0;
        this.currentGame = null;
        this.isPaused = false;
        this.awaitingContinue = false;
    },

    getProgress() {
        if (!this.currentGame) return null;
        return {
            current: this.currentGame.currentQuestionIndex,
            total: this.currentGame.questionsPerGame,
            percent: (this.currentGame.currentQuestionIndex / this.currentGame.questionsPerGame) * 100
        };
    }
};

window.GameManager = GameManager;
