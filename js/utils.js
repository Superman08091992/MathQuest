/**
 * Math Quest - Utility Functions
 * Helper functions and utilities used throughout the game
 */

const Utils = {
    escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    },

    /**
     * Generate a random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Generate a random number between min and max (inclusive) with specified decimal places
     */
    randomFloat(min, max, decimals = 2) {
        const value = Math.random() * (max - min) + min;
        return parseFloat(value.toFixed(decimals));
    },

    /**
     * Shuffle an array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * Pick a random element from an array
     */
    randomPick(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Format a number with commas for thousands
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /**
     * Clamp a number between min and max
     */
    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    },

    /**
     * Generate a unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Deep clone an object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Debounce function to limit how often a function can fire
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Format time in seconds to MM:SS format
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Calculate percentage
     */
    percentage(value, total) {
        return total === 0 ? 0 : Math.round((value / total) * 100);
    },

    /**
     * Create an emoji visual representation of a number
     */
    createVisualCount(count, emoji = '🔵') {
        return emoji.repeat(count);
    },

    /**
     * Get grade name from grade level
     */
    getGradeName(grade) {
        const gradeNames = {
            0: 'Kindergarten',
            1: 'Grade 1',
            2: 'Grade 2',
            3: 'Grade 3',
            4: 'Grade 4',
            5: 'Grade 5',
            6: 'Grade 6',
            7: 'Grade 7',
            8: 'Grade 8',
            9: 'Grade 9',
            10: 'Grade 10',
            11: 'Grade 11',
            12: 'Grade 12'
        };
        return gradeNames[grade] || `Grade ${grade}`;
    },

    /**
     * Get realm name for grade
     */
    getRealmName(grade) {
        const realms = [
            'Forest Realm',      // K
            'Enchanted Forest',  // 1
            'Crystal Lake',      // 2
            'Golden Fields',     // 3
            'Sky Village',       // 4
            'Mountain Outpost',  // 5
            'Crystal City',      // 6
            'Starlight Harbor',  // 7
            'Cloud City',        // 8
            'Cosmic Station',    // 9
            'Galactic Hub',      // 10
            'Nebula University', // 11
            'Infinity Spire'     // 12
        ];
        return realms[grade] || 'Unknown Realm';
    },

    /**
     * Get realm icon for grade
     */
    getRealmIcon(grade) {
        const icons = ['🌲', '🍄', '💎', '🌾', '⛅', '⛰️', '🏙️', '⚓', '☁️', '🚀', '🌌', '🎓', '🔮'];
        return icons[grade] || '📚';
    },

    /**
     * Check if a number is prime
     */
    isPrime(num) {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    },

    /**
     * Get factors of a number
     */
    getFactors(num) {
        const factors = [];
        for (let i = 1; i <= num; i++) {
            if (num % i === 0) factors.push(i);
        }
        return factors;
    },

    /**
     * Calculate greatest common divisor
     */
    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    },

    /**
     * Calculate least common multiple
     */
    lcm(a, b) {
        return Math.abs(a * b) / this.gcd(a, b);
    },

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Convert radians to degrees
     */
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    },

    /**
     * Round to nearest multiple
     */
    roundToMultiple(num, multiple) {
        return Math.round(num / multiple) * multiple;
    },

    /**
     * Generate distractors (wrong answers) around a correct answer
     */
    generateDistractors(correct, count = 3, range = 10) {
        const distractors = new Set();
        while (distractors.size < count) {
            const offset = this.randomInt(1, range) * (Math.random() > 0.5 ? 1 : -1);
            const wrong = correct + offset;
            if (wrong !== correct && wrong >= 0) {
                distractors.add(wrong);
            }
        }
        return Array.from(distractors);
    },

    /**
     * Format a large number with K/M/B suffixes
     */
    formatCompact(num) {
        const abs = Math.abs(num);
        if (abs >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (abs >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    },

    /**
     * Validate a math expression (basic safety check)
     */
    isValidMathExpression(expr) {
        // Only allow numbers, operators, and basic math functions
        const validPattern = /^[\d\s+\-*/().^√πe\s]+$/;
        return validPattern.test(expr);
    },

    /**
     * Parse a math fraction string (e.g., "3/4")
     */
    parseFraction(fractionStr) {
        const [num, den] = fractionStr.split('/').map(Number);
        return { numerator: num, denominator: den, value: num / den };
    },

    /**
     * Simplify a fraction
     */
    simplifyFraction(numerator, denominator) {
        const divisor = this.gcd(Math.abs(numerator), Math.abs(denominator));
        return {
            numerator: numerator / divisor,
            denominator: denominator / divisor
        };
    },

    /**
     * Format fraction as string
     */
    formatFraction(numerator, denominator) {
        if (denominator === 1) return numerator.toString();
        const simplified = this.simplifyFraction(numerator, denominator);
        return `${simplified.numerator}/${simplified.denominator}`;
    },

    /**
     * Convert decimal to fraction (approximate)
     */
    decimalToFraction(decimal, tolerance = 0.001) {
        let h1 = 1, h2 = 0;
        let k1 = 0, k2 = 1;
        let b = decimal;
        
        do {
            const a = Math.floor(b);
            let temp = h1;
            h1 = a * h1 + h2;
            h2 = temp;
            temp = k1;
            k1 = a * k1 + k2;
            k2 = temp;
            b = 1 / (b - a);
        } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);
        
        return { numerator: h1, denominator: k1 };
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Create a delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Check if localStorage is available
     */
    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Safely parse JSON
     */
    safeJSONParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return defaultValue;
        }
    },

    /**
     * Animate a number counting up
     */
    animateCounter(element, start, end, duration = 1000) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const current = Math.floor(start + (end - start) * easeProgress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    },

    /**
     * Get readable category name
     */
    getCategoryName(category) {
        const names = {
            'arithmetic': '➕ Arithmetic',
            'algebra': '🔤 Algebra',
            'geometry': '📐 Geometry',
            'trigonometry': '📊 Trigonometry',
            'calculus': '📈 Calculus',
            'physics': '⚛️ Physics',
            'reading': 'Reading',
            'writing': 'Academic Writing',
            'statistics': 'Statistics and Data',
            'logic': 'Logic and Reasoning',
            'civics': 'Civics and Government',
            'computer_science': 'Computer Science',
            'research': 'Research Methods',
            'biology': 'Biology',
            'chemistry': 'Chemistry',
            'science': 'Science',
            'history': 'History',
            'economics': 'Economics',
            'politics': 'Civics',
            'astronomy': 'Astronomy',
            'all': 'All Topics'
        };
        return names[category] || category;
    },

    /**
     * Generate a seeded random number (for reproducible questions)
     */
    seededRandom(seed) {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    },

    /**
     * Create a visual representation of place value
     */
    createPlaceValueVisual(number, placeValue) {
        const digit = Math.floor((number / placeValue) % 10);
        const symbols = {
            1: '🔵',
            10: '📦',
            100: '📚',
            1000: '🏦'
        };
        const symbol = symbols[placeValue] || '🔵';
        return symbol.repeat(digit);
    },

    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Add ordinal suffix to number
     */
    ordinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return num + "st";
        if (j === 2 && k !== 12) return num + "nd";
        if (j === 3 && k !== 13) return num + "rd";
        return num + "th";
    },

    /**
     * Calculate combination (nCr)
     */
    combination(n, r) {
        if (r > n) return 0;
        if (r === 0 || r === n) return 1;
        
        let result = 1;
        for (let i = 0; i < r; i++) {
            result *= (n - i) / (i + 1);
        }
        return Math.round(result);
    },

    /**
     * Calculate permutation (nPr)
     */
    permutation(n, r) {
        if (r > n) return 0;
        let result = 1;
        for (let i = 0; i < r; i++) {
            result *= (n - i);
        }
        return result;
    }
};

// Make Utils globally available
window.Utils = Utils;
