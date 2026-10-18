// Extended Question Templates Database - All Subjects (FIXED FORMAT)
// This file contains properly formatted multiple-choice questions

const QuestionTemplatesExtended = {
    
    // ============================================
    // READING COMPREHENSION
    // ============================================
    reading: [
        // Vocabulary - Elementary
        { id: 'read_vocab_001', category: 'reading', subcategory: 'vocabulary', gradeMin: 1, gradeMax: 3, difficulty: 1,
          template: 'What does "happy" mean?', variables: {}, 
          answerOptions: ['sad', 'joyful', 'angry', 'tired'], 
          solution: 'joyful' },
        { id: 'read_vocab_002', category: 'reading', subcategory: 'vocabulary', gradeMin: 1, gradeMax: 3, difficulty: 1,
          template: 'What does "big" mean?', variables: {}, 
          answerOptions: ['small', 'tiny', 'large', 'little'], 
          solution: 'large' },
        { id: 'read_vocab_003', category: 'reading', subcategory: 'vocabulary', gradeMin: 2, gradeMax: 4, difficulty: 2,
          template: 'What does "brave" mean?', variables: {}, 
          answerOptions: ['scared', 'fearful', 'courageous', 'worried'], 
          solution: 'courageous' },
        { id: 'read_vocab_004', category: 'reading', subcategory: 'vocabulary', gradeMin: 2, gradeMax: 4, difficulty: 2,
          template: 'What does "ancient" mean?', variables: {}, 
          answerOptions: ['new', 'very old', 'modern', 'current'], 
          solution: 'very old' },
        { id: 'read_vocab_005', category: 'reading', subcategory: 'vocabulary', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'What does "enormous" mean?', variables: {}, 
          answerOptions: ['tiny', 'small', 'huge', 'medium'], 
          solution: 'huge' },
        { id: 'read_vocab_006', category: 'reading', subcategory: 'vocabulary', gradeMin: 4, gradeMax: 6, difficulty: 3,
          template: 'What does "magnificent" mean?', variables: {}, 
          answerOptions: ['ugly', 'plain', 'splendid', 'boring'], 
          solution: 'splendid' },
        { id: 'read_vocab_007', category: 'reading', subcategory: 'vocabulary', gradeMin: 5, gradeMax: 7, difficulty: 3,
          template: 'What does "abundant" mean?', variables: {}, 
          answerOptions: ['scarce', 'few', 'plentiful', 'rare'], 
          solution: 'plentiful' },
          
        // Synonyms
        { id: 'read_syn_001', category: 'reading', subcategory: 'synonyms', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'Which word means the same as "quick"?', variables: {}, 
          answerOptions: ['slow', 'fast', 'careful', 'lazy'], 
          solution: 'fast' },
        { id: 'read_syn_002', category: 'reading', subcategory: 'synonyms', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'Which word means the same as "intelligent"?', variables: {}, 
          answerOptions: ['dumb', 'silly', 'smart', 'foolish'], 
          solution: 'smart' },
        { id: 'read_syn_003', category: 'reading', subcategory: 'synonyms', gradeMin: 4, gradeMax: 6, difficulty: 3,
          template: 'Which word means the same as "furious"?', variables: {}, 
          answerOptions: ['calm', 'peaceful', 'very angry', 'happy'], 
          solution: 'very angry' },
        { id: 'read_syn_004', category: 'reading', subcategory: 'synonyms', gradeMin: 4, gradeMax: 6, difficulty: 3,
          template: 'Which word means the same as "gleeful"?', variables: {}, 
          answerOptions: ['sad', 'joyful', 'angry', 'tired'], 
          solution: 'joyful' },
        { id: 'read_syn_005', category: 'reading', subcategory: 'synonyms', gradeMin: 5, gradeMax: 7, difficulty: 3,
          template: 'Which word means the same as "benevolent"?', variables: {}, 
          answerOptions: ['cruel', 'mean', 'kind', 'harsh'], 
          solution: 'kind' },
          
        // Antonyms
        { id: 'read_ant_001', category: 'reading', subcategory: 'antonyms', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'What is the opposite of "hot"?', variables: {}, 
          answerOptions: ['warm', 'cold', 'cool', 'freezing'], 
          solution: 'cold' },
        { id: 'read_ant_002', category: 'reading', subcategory: 'antonyms', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'What is the opposite of "up"?', variables: {}, 
          answerOptions: ['high', 'top', 'down', 'over'], 
          solution: 'down' },
        { id: 'read_ant_003', category: 'reading', subcategory: 'antonyms', gradeMin: 4, gradeMax: 6, difficulty: 3,
          template: 'What is the opposite of "difficult"?', variables: {}, 
          answerOptions: ['hard', 'easy', 'tough', 'challenging'], 
          solution: 'easy' },
        { id: 'read_ant_004', category: 'reading', subcategory: 'antonyms', gradeMin: 4, gradeMax: 6, difficulty: 3,
          template: 'What is the opposite of "ascend"?', variables: {}, 
          answerOptions: ['climb', 'rise', 'descend', 'soar'], 
          solution: 'descend' },
        { id: 'read_ant_005', category: 'reading', subcategory: 'antonyms', gradeMin: 5, gradeMax: 7, difficulty: 3,
          template: 'What is the opposite of "expand"?', variables: {}, 
          answerOptions: ['grow', 'contract', 'enlarge', 'increase'], 
          solution: 'contract' },
          
        // Grammar - Parts of Speech
        { id: 'read_gram_001', category: 'reading', subcategory: 'grammar', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'In "The dog runs fast", what is the verb?', variables: {}, 
          answerOptions: ['dog', 'runs', 'fast', 'the'], 
          solution: 'runs' },
        { id: 'read_gram_002', category: 'reading', subcategory: 'grammar', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'In "The red car", what is the adjective?', variables: {}, 
          answerOptions: ['the', 'red', 'car', 'none'], 
          solution: 'red' },
        { id: 'read_gram_003', category: 'reading', subcategory: 'grammar', gradeMin: 4, gradeMax: 6, difficulty: 3,
          template: 'In "She quickly ran", what is the adverb?', variables: {}, 
          answerOptions: ['she', 'quickly', 'ran', 'none'], 
          solution: 'quickly' },
        { id: 'read_gram_004', category: 'reading', subcategory: 'grammar', gradeMin: 4, gradeMax: 6, difficulty: 3,
          template: 'Which is a proper noun?', variables: {}, 
          answerOptions: ['city', 'person', 'London', 'building'], 
          solution: 'London' },
        { id: 'read_gram_005', category: 'reading', subcategory: 'grammar', gradeMin: 5, gradeMax: 7, difficulty: 3,
          template: 'In "The book was on the table", what is the preposition?', variables: {}, 
          answerOptions: ['book', 'was', 'on', 'table'], 
          solution: 'on' }
    ],

    // ============================================
    // SCIENCE
    // ============================================
    science: [
        // Elementary Science
        { id: 'sci_elem_001', category: 'science', subcategory: 'basics', gradeMin: 1, gradeMax: 3, difficulty: 1,
          template: 'How many legs does a spider have?', variables: {}, 
          answerOptions: ['6', '8', '10', '4'], 
          solution: '8' },
        { id: 'sci_elem_002', category: 'science', subcategory: 'basics', gradeMin: 1, gradeMax: 3, difficulty: 1,
          template: 'Which energy source supports photosynthesis in most green plants?', variables: {}, 
          answerOptions: ['darkness', 'sunlight', 'snow', 'rocks'], 
          solution: 'sunlight' },
        { id: 'sci_elem_003', category: 'science', subcategory: 'basics', gradeMin: 2, gradeMax: 4, difficulty: 1,
          template: 'What is H₂O?', variables: {}, 
          answerOptions: ['air', 'water', 'fire', 'earth'], 
          solution: 'water' },
        { id: 'sci_elem_004', category: 'science', subcategory: 'basics', gradeMin: 2, gradeMax: 4, difficulty: 1,
          template: 'Which gas do human cells need for aerobic respiration?', variables: {}, 
          answerOptions: ['carbon dioxide', 'oxygen', 'nitrogen', 'helium'], 
          solution: 'oxygen' },
        { id: 'sci_elem_005', category: 'science', subcategory: 'basics', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'Which is NOT a state of matter?', variables: {}, 
          answerOptions: ['solid', 'liquid', 'gas', 'light'], 
          solution: 'light' },
        { id: 'sci_elem_006', category: 'science', subcategory: 'basics', gradeMin: 3, gradeMax: 5, difficulty: 2,
          template: 'What is the center of an atom called?', variables: {}, 
          answerOptions: ['electron', 'nucleus', 'proton', 'neutron'], 
          solution: 'nucleus' },
          
        // Biology
        { id: 'sci_bio_001', category: 'science', subcategory: 'biology', gradeMin: 5, gradeMax: 8, difficulty: 3,
          template: 'What is the powerhouse of the cell?', variables: {}, 
          answerOptions: ['nucleus', 'mitochondria', 'ribosome', 'cell wall'], 
          solution: 'mitochondria' },
        { id: 'sci_bio_002', category: 'science', subcategory: 'biology', gradeMin: 6, gradeMax: 9, difficulty: 3,
          template: 'What is photosynthesis?', variables: {}, 
          answerOptions: ['plant breathing', 'plant eating', 'plant making food from sunlight', 'plant sleeping'], 
          solution: 'plant making food from sunlight' },
        { id: 'sci_bio_003', category: 'science', subcategory: 'biology', gradeMin: 7, gradeMax: 10, difficulty: 4,
          template: 'What is DNA?', variables: {}, 
          answerOptions: ['a vitamin', 'a protein', 'genetic material', 'a carbohydrate'], 
          solution: 'genetic material' },
        { id: 'sci_bio_004', category: 'science', subcategory: 'biology', gradeMin: 7, gradeMax: 10, difficulty: 4,
          template: 'Which organ pumps blood?', variables: {}, 
          answerOptions: ['brain', 'heart', 'liver', 'lungs'], 
          solution: 'heart' },
        { id: 'sci_bio_005', category: 'science', subcategory: 'biology', gradeMin: 8, gradeMax: 11, difficulty: 4,
          template: 'What is the largest organ in the human body?', variables: {}, 
          answerOptions: ['heart', 'brain', 'skin', 'liver'], 
          solution: 'skin' }
    ],

    // ============================================
    // HISTORY
    // ============================================
    history: [
        { id: 'hist_us_001', category: 'history', subcategory: 'US history', gradeMin: 4, gradeMax: 8, difficulty: 2,
          template: 'Who was the first President of the United States?', variables: {}, 
          answerOptions: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'], 
          solution: 'George Washington' },
        { id: 'hist_us_002', category: 'history', subcategory: 'US history', gradeMin: 5, gradeMax: 9, difficulty: 3,
          template: 'In what year did the United States declare independence?', variables: {}, 
          answerOptions: ['1776', '1789', '1812', '1865'], 
          solution: '1776' },
        { id: 'hist_us_003', category: 'history', subcategory: 'US history', gradeMin: 6, gradeMax: 10, difficulty: 3,
          template: 'Which amendment abolished slavery?', variables: {}, 
          answerOptions: ['First', 'Tenth', 'Thirteenth', 'Twenty-first'], 
          solution: 'Thirteenth' },
        { id: 'hist_world_001', category: 'history', subcategory: 'world history', gradeMin: 6, gradeMax: 10, difficulty: 3,
          template: 'Who was the ancient Egyptian sun god?', variables: {}, 
          answerOptions: ['Osiris', 'Ra', 'Anubis', 'Horus'], 
          solution: 'Ra' },
        { id: 'hist_world_002', category: 'history', subcategory: 'world history', gradeMin: 7, gradeMax: 11, difficulty: 4,
          template: 'What year did World War II end?', variables: {}, 
          answerOptions: ['1943', '1944', '1945', '1946'], 
          solution: '1945' },
        { id: 'hist_world_003', category: 'history', subcategory: 'world history', gradeMin: 7, gradeMax: 11, difficulty: 4,
          template: 'Which dynasty connected earlier defensive walls in an early Great Wall project?', variables: {}, 
          answerOptions: ['Ming Dynasty', 'Qin Dynasty', 'Han Dynasty', 'Tang Dynasty'], 
          solution: 'Qin Dynasty' }
    ],

    // ============================================
    // ECONOMICS
    // ============================================
    economics: [
        { id: 'econ_basic_001', category: 'economics', subcategory: 'basics', gradeMin: 6, gradeMax: 10, difficulty: 3,
          template: 'What is supply and demand?', variables: {}, 
          answerOptions: ['government rules', 'relationship between availability and desire', 'tax system', 'banking method'], 
          solution: 'relationship between availability and desire' },
        { id: 'econ_basic_002', category: 'economics', subcategory: 'basics', gradeMin: 7, gradeMax: 11, difficulty: 3,
          template: 'What does price inflation mean?', variables: {}, 
          answerOptions: ['a general decrease in prices', 'a general increase in prices', 'unchanging prices', 'a decline in population'], 
          solution: 'a general increase in prices' },
        { id: 'econ_basic_003', category: 'economics', subcategory: 'basics', gradeMin: 8, gradeMax: 12, difficulty: 4,
          template: 'What is GDP?', variables: {}, 
          answerOptions: ['Government Debt Program', 'Gross Domestic Product', 'Global Development Plan', 'General Data Processing'], 
          solution: 'Gross Domestic Product' },
        { id: 'econ_basic_004', category: 'economics', subcategory: 'basics', gradeMin: 8, gradeMax: 12, difficulty: 4,
          template: 'Which of these can be influenced by central bank monetary policy?', variables: {}, 
          answerOptions: ['army', 'money supply', 'schools', 'roads'], 
          solution: 'money supply' }
    ],

    // ============================================
    // POLITICS
    // ============================================
    politics: [
        { id: 'poli_gov_001', category: 'politics', subcategory: 'government', gradeMin: 6, gradeMax: 10, difficulty: 3,
          template: 'What are the three branches of US government?', variables: {}, 
          answerOptions: ['Army, Navy, Air Force', 'Executive, Legislative, Judicial', 'Federal, State, Local', 'President, Congress, People'], 
          solution: 'Executive, Legislative, Judicial' },
        { id: 'poli_gov_002', category: 'politics', subcategory: 'government', gradeMin: 7, gradeMax: 11, difficulty: 3,
          template: 'What is democracy?', variables: {}, 
          answerOptions: ['rule by king', 'rule by military', 'rule by the people', 'rule by church'], 
          solution: 'rule by the people' },
        { id: 'poli_gov_003', category: 'politics', subcategory: 'government', gradeMin: 8, gradeMax: 12, difficulty: 4,
          template: 'In the United States, what is the Constitution?', variables: {}, 
          answerOptions: ['a law book', 'supreme law of the land', 'a treaty', 'a historical document'], 
          solution: 'supreme law of the land' }
    ],

    // ============================================
    // ASTRONOMY
    // ============================================
    astronomy: [
        { id: 'astro_basic_001', category: 'astronomy', subcategory: 'solar system', gradeMin: 3, gradeMax: 6, difficulty: 2,
          template: 'How many planets are in our solar system?', variables: {}, 
          answerOptions: ['7', '8', '9', '10'], 
          solution: '8' },
        { id: 'astro_basic_002', category: 'astronomy', subcategory: 'solar system', gradeMin: 4, gradeMax: 7, difficulty: 2,
          template: 'What is the closest planet to the Sun?', variables: {}, 
          answerOptions: ['Venus', 'Mercury', 'Earth', 'Mars'], 
          solution: 'Mercury' },
        { id: 'astro_basic_003', category: 'astronomy', subcategory: 'solar system', gradeMin: 5, gradeMax: 8, difficulty: 3,
          template: 'What is the largest planet in our solar system?', variables: {}, 
          answerOptions: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], 
          solution: 'Jupiter' },
        { id: 'astro_space_001', category: 'astronomy', subcategory: 'space', gradeMin: 6, gradeMax: 10, difficulty: 3,
          template: 'What is a galaxy?', variables: {}, 
          answerOptions: ['a single star', 'a planet', 'a gravitationally bound system of stars, gas, dust and dark matter', 'a moon'], 
          solution: 'a gravitationally bound system of stars, gas, dust and dark matter' },
        { id: 'astro_space_002', category: 'astronomy', subcategory: 'space', gradeMin: 7, gradeMax: 11, difficulty: 4,
          template: 'What is the speed of light?', variables: {}, 
          answerOptions: ['300 km/s', '3,000 km/s', '30,000 km/s', '300,000 km/s'], 
          solution: '300,000 km/s' },
        { id: 'astro_space_003', category: 'astronomy', subcategory: 'space', gradeMin: 8, gradeMax: 12, difficulty: 4,
          template: 'What is a black hole?', variables: {}, 
          answerOptions: ['a dark planet', 'a region whose gravity prevents light from escaping', 'an empty region of space', 'a type of comet'], 
          solution: 'a region whose gravity prevents light from escaping' }
    ]
};

// Export for use in math engine
window.QuestionTemplatesExtended = QuestionTemplatesExtended;
