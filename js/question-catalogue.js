/**
 * Unified playable question registry.
 * Includes the legacy procedural mathematics bank, new grade-specific skills,
 * and the curated, fixed-format subject facts already shipped in this project.
 * The older "extended" file with encoded numeric choices is retained only as
 * historical source: it is deliberately NOT registered.
 */
const QuestionCatalogue = (() => {
    // Do not silently load an arithmetic-only partial question bank if files are missing.
    if (typeof QuestionTemplates === 'undefined' ||
        typeof QuestionTemplatesAdvanced === 'undefined' ||
        typeof QuestionTemplatesExtended === 'undefined' ||
        typeof CollegeCurriculum === 'undefined' || typeof CollegeProcedural === 'undefined') {
        throw new Error('Question source files missing. Reinstall the complete game package.');
    }
    const staticSubjects = QuestionTemplatesExtended;
    const catalogue = [];
    for (const [category, entries] of Object.entries(staticSubjects)) {
        for (const entry of entries) {
            if (entry.category !== category ||
                !Array.isArray(entry.answerOptions) || entry.answerOptions.length !== 4 ||
                new Set(entry.answerOptions).size !== 4 ||
                !entry.answerOptions.includes(entry.solution) ||
                !Number.isInteger(entry.gradeMin) || !Number.isInteger(entry.gradeMax) ||
                entry.gradeMin < 0 || entry.gradeMax > 12 || entry.gradeMin > entry.gradeMax) {
                throw new Error(`Invalid source question ${entry.id}`);
            }
            catalogue.push(Object.freeze({
                type: entry.id,
                isFixed: true,
                category,
                skill: entry.subcategory,
                gradeMin: entry.gradeMin,
                gradeMax: entry.gradeMax,
                generate() {
                    return {
                        text: entry.template,
                        answer: entry.solution,
                        answers: Utils.shuffleArray(entry.answerOptions),
                        difficulty: entry.difficulty,
                        hint: 'Think about the topic and eliminate answers that do not fit the definition.'
                    };
                }
            }));
        }
    }
    const collegeFixed=CollegeCurriculum.items, collegeProcedural=CollegeProcedural.items;
    return Object.freeze({
        staticCount: catalogue.length + collegeFixed.length,
        collegeFixedCount: collegeFixed.length, collegeProceduralCount: collegeProcedural.length,
        getQuestionsForGrade(grade) {
            if (!Number.isInteger(grade) || grade < 0 || grade > 12) return [];
            const base = QuestionTemplates.getQuestionsForGrade(grade);
            const advanced = typeof QuestionTemplatesAdvanced === 'undefined' ? [] :
                QuestionTemplatesAdvanced.getQuestionsForGrade(grade);
            return [...base, ...advanced, ...catalogue.filter(t => t.gradeMin <= grade && t.gradeMax >= grade),
                ...collegeFixed.filter(t => t.gradeMin <= grade && t.gradeMax >= grade),
                ...collegeProcedural.filter(t => t.gradeMin <= grade && t.gradeMax >= grade)];
        },
        getCoverage() {
            return Array.from({length:13},(_, grade) => {
                const bank = this.getQuestionsForGrade(grade);
                return { grade, templates: bank.length,
                    categories: [...new Set(bank.map(t=>t.category))].sort(),
                    skills: [...new Set(bank.map(t=>t.skill || t.type))].length };
            });
        }
    });
})();
window.QuestionCatalogue = QuestionCatalogue;
