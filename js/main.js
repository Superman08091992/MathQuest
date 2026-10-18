/**
 * Math Quest - Main Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Prevent incomplete/stale installs from quietly falling back to arithmetic.
        const gradeFour = QuestionCatalogue.getQuestionsForGrade(4);
        if (QuestionCatalogue.staticCount < 200 || CollegeCurriculum.count < 190 ||
            CollegeProcedural.count < 80 || QuestionTemplatesAdvanced.count < 118 ||
            gradeFour.length < 33 || new Set(gradeFour.map(q => q.category)).size < 6) {
            throw new Error('The expanded question bank is incomplete or out of date.');
        }
        SaveManager.init();
        ProfileSystem.init();
        ProgressionSystem.init?.();
        RewardSystem.init();
        AudioSystem.init();
        UIManager.init();
        console.log('Math Quest 3.3.0 initialized with academic readiness curriculum.');
    } catch (error) {
        console.error('Math Quest could not start:', error);
        const warning = document.getElementById('app-error');
        if (warning) {
            warning.textContent = 'Math Quest could not load all its subjects. Reinstall the complete 3.3.0 application. Details: ' + error.message;
            warning.hidden = false;
        }
        document.getElementById('start-game')?.setAttribute('disabled', '');
    }
});
