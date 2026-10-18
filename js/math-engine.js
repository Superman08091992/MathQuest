/**
 * Math Quest - Unified Question Engine.
 * Template counts are NOT the number of unique questions. Generated questions
 * are only considered nonrepeating when their prompts and keys differ.
 */
const MathEngine = {
    currentGrade: 1,
    currentCategory: 'all',

    init(grade, category) {
        this.setGrade(grade ?? 1);
        this.setCategory(category || 'all');
    },

    setGrade(grade) {
        if (!Number.isInteger(grade) || grade < 0 || grade > 12) throw new RangeError('Invalid grade');
        this.currentGrade = grade;
    },

    setCategory(category) { this.currentCategory = category || 'all'; },

    getAvailableTemplates(grade = this.currentGrade, category = this.currentCategory) {
        if (typeof QuestionCatalogue === 'undefined' ||
            typeof QuestionCatalogue.getQuestionsForGrade !== 'function') {
            throw new Error('Question catalogue failed to load. The app needs a complete update; do not play with a partial question bank.');
        }
        const templates = QuestionCatalogue.getQuestionsForGrade(grade);
        return category === 'all' ? templates : templates.filter(t => t.category === category);
    },

    // Used for bounded, privacy-preserving profile-local review history.
    questionKey(question) {
        const value = `${question.grade}|${question.type}|${question.text}|${question.visual || ''}|${question.answer}`;
        let hash = 2166136261;
        for (let i = 0; i < value.length; i++) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return `q${(hash >>> 0).toString(16).padStart(8, '0')}`;
    },

    fromTemplate(template) {
        const question = template.generate();
        question.id = Utils.generateId();
        question.type = template.type;
        question.category = template.category;
        question.skill = template.skill || template.type;
        question.grade = this.currentGrade;
        return question;
    },

    generateQuestion() {
        const templates = this.getAvailableTemplates();
        if (!templates.length) throw new Error('No questions are available for this grade and category');
        return this.fromTemplate(Utils.randomPick(templates));
    },

    validateAnswer(question, answer) {
        if (typeof question.answer === 'number') {
            // Do not treat null/blank as the number zero.
            if (answer === null || answer === undefined || String(answer).trim() === '') return false;
            return Number(answer) === question.answer;
        }
        if (question.caseSensitive) return String(answer).trim() === String(question.answer).trim();
        return String(answer).toLowerCase().trim() === String(question.answer).toLowerCase().trim();
    },

    calculatePoints(question, timeRemaining, isTimed, streak) {
        let points = Math.floor((10 + question.difficulty * 2) * (isTimed ? 1.5 : 1));
        if (isTimed && timeRemaining > 0) points += Math.floor(timeRemaining / 3);
        if (streak > 2) points += Math.min(streak * 2, 20);
        return points;
    },

    /**
     * Balance template exposure, avoid duplicates within a quiz when possible,
     * prefer prompts that are not in the player's last 250 answered questions.
     * Finite categories can exhaust their variations; then repetition is allowed
     * rather than failing or looping forever.
     */
    generateQuestions(count) {
        if (!Number.isInteger(count) || count < 1 || count > 100) {
            throw new RangeError('Question count must be between 1 and 100');
        }
        const pool = this.getAvailableTemplates();
        if (!pool.length) throw new Error('No questions are available for this grade and category');
        const recent = new Set((typeof SaveManager === 'undefined' ? [] :
            SaveManager.getCurrentProfile()?.recentQuestionKeys || []).slice(-250));
        // Fixed-fact-only categories cannot produce new numerical variations.
        // Shorten those games rather than repeating identical trivia.
        if (pool.every(template => template.isFixed === true)) count = Math.min(count, pool.length);
        const used = new Set();
        const questions = [];
        let round = [];
        for (let i = 0; i < count; i++) {
            if (round.length === 0) round = Utils.shuffleArray(pool);
            const preferred = round.pop();
            const candidates = [preferred, ...Utils.shuffleArray(pool.filter(t => t !== preferred))];
            let best = null;
            let bestScore = -1;
            for (const template of candidates) {
                // Additional attempts help parameterized templates avoid stale variants.
                const attempts = template === preferred ? 25 : 3;
                for (let tries = 0; tries < attempts; tries++) {
                    const generated = this.fromTemplate(template);
                    const key = this.questionKey(generated);
                    // Fresh for this quiz AND not recently answered is ideal.
                    const score = (used.has(key) ? 0 : 2) + (recent.has(key) ? 0 : 1);
                    if (score > bestScore) { best = generated; bestScore = score; }
                    if (score === 3) break;
                }
                if (bestScore === 3) break;
            }
            questions.push(best);
            used.add(this.questionKey(best));
        }
        return questions;
    }
};
window.MathEngine = MathEngine;
