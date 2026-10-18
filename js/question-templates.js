/**
 * Math Quest - Question Templates
 * Defines question templates and categories for all grade levels
 */

const QuestionTemplates = {
    // Kindergarten - Basic counting and simple addition/subtraction
    kindergarten: [
        {
            type: 'counting',
            category: 'arithmetic',
            generate() {
                const count = Utils.randomInt(1, 10);
                return {
                    text: `How many items do you see?`,
                    visual: Utils.createVisualCount(count, '🔵'),
                    answer: count,
                    answers: Utils.shuffleArray([count, ...Utils.generateDistractors(count, 3, 3)]),
                    difficulty: 1,
                    hint: 'Count the circles one by one.'
                };
            }
        },
        {
            type: 'addition_visual',
            category: 'arithmetic',
            generate() {
                const a = Utils.randomInt(1, 5);
                const b = Utils.randomInt(1, 5);
                const visual = Utils.createVisualCount(a, '🔴') + ' + ' + Utils.createVisualCount(b, '🔵');
                return {
                    text: `${visual} = ?`,
                    answer: a + b,
                    answers: Utils.shuffleArray([a + b, ...Utils.generateDistractors(a + b, 3, 3)]),
                    difficulty: 1,
                    hint: `Count all the circles together.`
                };
            }
        }
    ],

    // Grade 1 - Addition/subtraction within 20, place value
    grade1: [
        {
            type: 'addition_within20',
            category: 'arithmetic',
            generate() {
                const a = Utils.randomInt(1, 15);
                const b = Utils.randomInt(1, 20 - a);
                return {
                    text: `${a} + ${b} = ?`,
                    answer: a + b,
                    answers: Utils.shuffleArray([a + b, ...Utils.generateDistractors(a + b, 3, 5)]),
                    difficulty: 1,
                    hint: `Start with ${a} and count up ${b} more.`
                };
            }
        },
        {
            type: 'subtraction_within20',
            category: 'arithmetic',
            generate() {
                const a = Utils.randomInt(5, 20);
                const b = Utils.randomInt(1, a);
                return {
                    text: `${a} - ${b} = ?`,
                    answer: a - b,
                    answers: Utils.shuffleArray([a - b, ...Utils.generateDistractors(a - b, 3, 5)]),
                    difficulty: 1,
                    hint: `Start with ${a} and count down ${b}.`
                };
            }
        }
    ],

    // Grade 2 - Add/sub within 100, intro to multiplication
    grade2: [
        {
            type: 'addition_within100',
            category: 'arithmetic',
            generate() {
                const a = Utils.randomInt(10, 90);
                const b = Utils.randomInt(5, Math.min(50, 100 - a));
                return {
                    text: `${a} + ${b} = ?`,
                    answer: a + b,
                    answers: Utils.shuffleArray([a + b, ...Utils.generateDistractors(a + b, 3, 10)]),
                    difficulty: 2,
                    hint: `Add the tens, then add the ones.`
                };
            }
        },
        {
            type: 'multiplication_intro',
            category: 'arithmetic',
            generate() {
                const a = Utils.randomInt(2, 5);
                const b = Utils.randomInt(1, 5);
                return {
                    text: `${b} groups of ${a} = ?`,
                    answer: a * b,
                    answers: Utils.shuffleArray([a * b, ...Utils.generateDistractors(a * b, 3, 8)]),
                    difficulty: 2,
                    hint: `Multiplication is repeated addition.`
                };
            }
        }
    ],

    // Grade 3 - Multiplication/division, fractions, area
    grade3: [
        {
            type: 'multiplication_basic',
            category: 'arithmetic',
            generate() {
                const a = Utils.randomInt(2, 9);
                const b = Utils.randomInt(2, 9);
                return {
                    text: `${a} × ${b} = ?`,
                    answer: a * b,
                    answers: Utils.shuffleArray([a * b, ...Utils.generateDistractors(a * b, 3, 15)]),
                    difficulty: 3,
                    hint: `Think of ${a} groups of ${b}.`
                };
            }
        },
        {
            type: 'division_basic',
            category: 'arithmetic',
            generate() {
                const b = Utils.randomInt(2, 9);
                const answer = Utils.randomInt(2, 9);
                const a = b * answer;
                return {
                    text: `${a} ÷ ${b} = ?`,
                    answer: answer,
                    answers: Utils.shuffleArray([answer, ...Utils.generateDistractors(answer, 3, 5)]),
                    difficulty: 3,
                    hint: `How many groups of ${b} make ${a}?`
                };
            }
        },
        {
            type: 'area_rectangle',
            category: 'geometry',
            generate() {
                const length = Utils.randomInt(3, 12);
                const width = Utils.randomInt(3, 12);
                return {
                    text: `Find the area of a rectangle with length ${length} and width ${width}.`,
                    answer: length * width,
                    answers: Utils.shuffleArray([length * width, ...Utils.generateDistractors(length * width, 3, 15)]),
                    difficulty: 3,
                    hint: `Area = length × width`
                };
            }
        }
    ],

    // Grade 4 - Multi-digit operations, factors, patterns
    grade4: [
        {
            type: 'multiplication_2digit',
            category: 'arithmetic',
            generate() {
                const a = Utils.randomInt(10, 99);
                const b = Utils.randomInt(2, 9);
                return {
                    text: `${a} × ${b} = ?`,
                    answer: a * b,
                    answers: Utils.shuffleArray([a * b, ...Utils.generateDistractors(a * b, 3, 50)]),
                    difficulty: 4,
                    hint: `Multiply the ones, then multiply the tens.`
                };
            }
        },
        {
            type: 'factors_identify',
            category: 'arithmetic',
            generate() {
                const num = Utils.randomInt(12, 48);
                const factors = Utils.getFactors(num);
                const correct = Utils.randomPick(factors);
                const wrongOptions = [];
                while (wrongOptions.length < 3) {
                    const wrong = Utils.randomInt(2, num - 1);
                    if (!factors.includes(wrong) && !wrongOptions.includes(wrong)) {
                        wrongOptions.push(wrong);
                    }
                }
                return {
                    text: `Which number is a factor of ${num}?`,
                    answer: correct,
                    answers: Utils.shuffleArray([correct, ...wrongOptions]),
                    difficulty: 4,
                    hint: `A factor divides evenly into ${num}.`
                };
            }
        }
    ],

    // Grade 5 - Decimals, fractions operations, volume
    grade5: [
        {
            type: 'decimal_addition',
            category: 'arithmetic',
            generate() {
                const a = (Utils.randomInt(1, 50) / 10).toFixed(1);
                const b = (Utils.randomInt(1, 50) / 10).toFixed(1);
                const sum = (parseFloat(a) + parseFloat(b)).toFixed(1);
                return {
                    text: `${a} + ${b} = ?`,
                    answer: sum,
                    answers: Utils.shuffleArray([sum, ...Utils.generateDistractors(parseFloat(sum), 3, 5).map(x => x.toFixed(1))]),
                    difficulty: 5,
                    hint: `Line up the decimal points and add.`
                };
            }
        },
        {
            type: 'volume_rectangular_prism',
            category: 'geometry',
            generate() {
                const l = Utils.randomInt(3, 10);
                const w = Utils.randomInt(3, 10);
                const h = Utils.randomInt(3, 10);
                return {
                    text: `Find the volume of a box with length ${l}, width ${w}, and height ${h}.`,
                    answer: l * w * h,
                    answers: Utils.shuffleArray([l * w * h, ...Utils.generateDistractors(l * w * h, 3, 50)]),
                    difficulty: 5,
                    hint: `Volume = length × width × height`
                };
            }
        }
    ],

    // Grade 6 - Ratios, percents, exponents, basic algebra
    grade6: [
        {
            type: 'ratio_simplify',
            category: 'arithmetic',
            generate() {
                const base = Utils.randomInt(2, 8);
                const a = base * Utils.randomInt(2, 5);
                const b = base * Utils.randomInt(2, 5);
                const gcd = Utils.gcd(a, b);
                return {
                    text: `Simplify the ratio ${a}:${b}`,
                    answer: `${a/gcd}:${b/gcd}`,
                    // Deliberately change one part at a time. Unsimplified ratios
                    // are equivalent to the correct answer, not distractors.
                    answers: Utils.shuffleArray([
                        `${a/gcd}:${b/gcd}`,
                        `${a/gcd + 1}:${b/gcd}`,
                        `${a/gcd}:${b/gcd + 1}`,
                        `${a/gcd + 2}:${b/gcd}`
                    ]),
                    difficulty: 6,
                    hint: `Find the GCD of ${a} and ${b}, then divide both parts.`
                };
            }
        },
        {
            type: 'percent_of_number',
            category: 'arithmetic',
            generate() {
                const percent = Utils.randomPick([10, 20, 25, 50, 75]);
                const base = Utils.randomInt(20, 100);
                const answer = (base * percent / 100);
                return {
                    text: `What is ${percent}% of ${base}?`,
                    answer: answer,
                    answers: Utils.shuffleArray([answer, ...Utils.generateDistractors(answer, 3, 15)]),
                    difficulty: 6,
                    hint: `${percent}% = ${percent}/100. Multiply ${base} × ${percent}/100.`
                };
            }
        },
        {
            type: 'exponents_basic',
            category: 'algebra',
            generate() {
                const base = Utils.randomInt(2, 9);
                const exp = Utils.randomInt(2, 4);
                return {
                    text: `${base}^${exp} = ?`,
                    answer: Math.pow(base, exp),
                    answers: Utils.shuffleArray([Math.pow(base, exp), ...Utils.generateDistractors(Math.pow(base, exp), 3, 20)]),
                    difficulty: 6,
                    hint: `${base}^${exp} means ${base} multiplied by itself ${exp} times.`
                };
            }
        },
        {
            type: 'solve_one_step_equation',
            category: 'algebra',
            generate() {
                const x = Utils.randomInt(2, 15);
                const isAdd = Math.random() > 0.5;
                if (isAdd) {
                    const c = Utils.randomInt(2, 20);
                    return {
                        text: `x + ${c} = ${x + c}`,
                        answer: x,
                        answers: Utils.shuffleArray([x, ...Utils.generateDistractors(x, 3, 5)]),
                        difficulty: 6,
                        hint: `Subtract ${c} from both sides.`
                    };
                } else {
                    const c = Utils.randomInt(2, 5);
                    return {
                        text: `${c}x = ${c * x}`,
                        answer: x,
                        answers: Utils.shuffleArray([x, ...Utils.generateDistractors(x, 3, 5)]),
                        difficulty: 6,
                        hint: `Divide both sides by ${c}.`
                    };
                }
            }
        }
    ],

    // Grade 7 - Integers, equations, probability
    grade7: [
        {
            type: 'two_step_equation',
            category: 'algebra',
            generate() {
                const x = Utils.randomInt(2, 10);
                const a = Utils.randomInt(2, 5);
                const b = Utils.randomInt(2, 10);
                const result = a * x + b;
                return {
                    text: `${a}x + ${b} = ${result}`,
                    answer: x,
                    answers: Utils.shuffleArray([x, ...Utils.generateDistractors(x, 3, 5)]),
                    difficulty: 7,
                    hint: `First subtract ${b}, then divide by ${a}.`
                };
            }
        },
        {
            type: 'percent_change',
            category: 'arithmetic',
            generate() {
                const original = Utils.randomInt(20, 100);
                const percentChange = Utils.randomInt(10, 50);
                const change = original * percentChange / 100;
                const newValue = (original + change).toFixed(2);
                return {
                    text: `${original} increased to ${newValue}. What is the percent change?`,
                    answer: percentChange,
                    answers: Utils.shuffleArray([percentChange, ...Utils.generateDistractors(percentChange, 3, 20)]),
                    difficulty: 7,
                    hint: `Percent change = |change|/original × 100`
                };
            }
        }
    ],

    // Grade 8 - Linear equations, Pythagorean theorem, functions
    grade8: [
        {
            type: 'pythagorean_theorem',
            category: 'geometry',
            generate() {
                const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25]];
                const [a, b, c] = Utils.randomPick(triples);
                return {
                    text: `Find the hypotenuse of a right triangle with legs ${a} and ${b}.`,
                    answer: c,
                    answers: Utils.shuffleArray([c, ...Utils.generateDistractors(c, 3, 10)]),
                    difficulty: 8,
                    hint: `c² = a² + b². Take the square root.`
                };
            }
        },
        {
            type: 'slope_from_points',
            category: 'algebra',
            generate() {
                const x1 = Utils.randomInt(-5, 5);
                const y1 = Utils.randomInt(-5, 5);
                const run = Utils.randomInt(1, 5);
                const rise = Utils.randomInt(-5, 5) || 1;
                const x2 = x1 + run;
                const y2 = y1 + rise;
                const simplified = Utils.simplifyFraction(rise, run);
                return {
                    text: `Find the slope between (${x1}, ${y1}) and (${x2}, ${y2}).`,
                    answer: `${simplified.numerator}/${simplified.denominator}`,
                    answers: Utils.shuffleArray([
                        `${simplified.numerator}/${simplified.denominator}`,
                        `${simplified.numerator + 1}/${simplified.denominator}`,
                        `${simplified.numerator - 1}/${simplified.denominator}`,
                        `${simplified.numerator + 2}/${simplified.denominator}`
                    ]),
                    displayAs: 'fraction',
                    difficulty: 8,
                    hint: `Slope = (y2 - y1) / (x2 - x1) = rise / run`
                };
            }
        }
    ],

    // Grade 9 - Algebra 1: Quadratic basics, systems
    grade9: [
        {
            type: 'quadratic_expand',
            category: 'algebra',
            generate() {
                const a = Utils.randomInt(1, 5);
                const xCoeff = 2 * a;
                const constTerm = a * a;
                return {
                    text: `Expand: (x + ${a})²`,
                    answer: `x² + ${xCoeff}x + ${constTerm}`,
                    answers: Utils.shuffleArray([
                        `x² + ${xCoeff}x + ${constTerm}`,
                        `x² + ${a}x + ${constTerm}`,
                        `x² + ${xCoeff}x + ${constTerm + 1}`,
                        `x² + ${constTerm}`
                    ]),
                    difficulty: 9,
                    hint: `(x + a)² = x² + 2ax + a²`
                };
            }
        },
        {
            type: 'system_linear',
            category: 'algebra',
            generate() {
                const x = Utils.randomInt(1, 10);
                const y = Utils.randomInt(1, 10);
                const c1 = x + y;
                const c2 = x - y;
                return {
                    text: `Solve: x + y = ${c1}, x - y = ${c2}`,
                    answer: `(${x}, ${y})`,
                    answers: Utils.shuffleArray([
                        `(${x}, ${y})`,
                        `(${x + 1}, ${y})`,
                        `(${x}, ${y + 1})`,
                        `(${x + 1}, ${y + 1})`
                    ]),
                    difficulty: 9,
                    hint: `Add the equations to eliminate y, then solve.`
                };
            }
        }
    ],

    // Grade 10 - Geometry: Circles, triangles, transformations
    grade10: [
        {
            type: 'circle_area',
            category: 'geometry',
            generate() {
                const r = Utils.randomInt(2, 10);
                const area = Math.round(3.14 * r * r * 100) / 100;
                return {
                    text: `Find the area of a circle with radius ${r}. (Use π ≈ 3.14)`,
                    answer: area,
                    answers: Utils.shuffleArray([area, ...Utils.generateDistractors(Math.floor(area), 3, 20)]),
                    difficulty: 10,
                    hint: `A = πr² = 3.14 × ${r}²`
                };
            }
        },
        {
            type: 'trigonometry_sohcahtoa',
            category: 'trigonometry',
            generate() {
                const angle = Utils.randomPick([30, 45, 60]);
                const func = Utils.randomPick(['sin', 'cos', 'tan']);
                const values = {
                    'sin': { 30: '1/2', 45: '√2/2', 60: '√3/2' },
                    'cos': { 30: '√3/2', 45: '√2/2', 60: '1/2' },
                    'tan': { 30: '√3/3', 45: '1', 60: '√3' }
                };
                const wrongValues = [...new Set(Object.values(values).flatMap(Object.values))]
                    .filter(v => v !== values[func][angle]);
                const distractors = Utils.shuffleArray(wrongValues).slice(0, 3);
                return {
                    text: `What is ${func}(${angle}°)?`,
                    answer: values[func][angle],
                    answers: Utils.shuffleArray([values[func][angle], ...distractors]),
                    difficulty: 10,
                    hint: `Remember SOH CAH TOA or special triangles.`
                };
            }
        }
    ],

    // Grade 11 - Algebra 2: Logarithms, complex numbers, sequences
    grade11: [
        {
            type: 'logarithm_basic',
            category: 'algebra',
            generate() {
                const base = Utils.randomPick([2, 3, 5, 10]);
                const exp = Utils.randomInt(2, 4);
                const result = Math.pow(base, exp);
                return {
                    text: `Evaluate: log_${base}(${result})`,
                    answer: exp,
                    answers: Utils.shuffleArray([exp, ...Utils.generateDistractors(exp, 3, 3)]),
                    difficulty: 11,
                    hint: `log_b(x) asks: "b to what power equals x?"`
                };
            }
        },
        {
            type: 'arithmetic_sequence',
            category: 'algebra',
            generate() {
                const a1 = Utils.randomInt(2, 10);
                const d = Utils.randomInt(2, 5);
                const n = Utils.randomInt(5, 10);
                const an = a1 + (n - 1) * d;
                return {
                    text: `Find the ${n}th term of: ${a1}, ${a1 + d}, ${a1 + 2 * d}, ...`,
                    answer: an,
                    answers: Utils.shuffleArray([an, ...Utils.generateDistractors(an, 3, 15)]),
                    difficulty: 11,
                    hint: `a_n = a₁ + (n-1)d`
                };
            }
        }
    ],

    // Grade 12 - Pre-Calculus: Limits, advanced trig, vectors
    grade12: [
        {
            type: 'limit_basic',
            category: 'calculus',
            generate() {
                const a = Utils.randomInt(2, 5);
                const b = Utils.randomInt(1, 5);
                const c = Utils.randomInt(1, 10);
                const x = Utils.randomInt(1, 5);
                const result = a * x * x + b * x + c;
                return {
                    text: `Find the limit as x→${x} of ${a}x² + ${b}x + ${c}`,
                    answer: result,
                    answers: Utils.shuffleArray([result, ...Utils.generateDistractors(result, 3, 20)]),
                    difficulty: 12,
                    hint: `For polynomials, substitute the value directly.`
                };
            }
        },
        {
            type: 'derivative_power_rule',
            category: 'calculus',
            generate() {
                const n = Utils.randomInt(2, 5);
                const a = Utils.randomInt(1, 5);
                return {
                    text: `Find the derivative of ${a}x^${n}`,
                    answer: `${a * n}x^${n - 1}`,
                    answers: Utils.shuffleArray([
                        `${a * n}x^${n - 1}`,
                        `${a * n + 1}x^${n - 1}`,
                        `${a * n}x^${n}`,
                        `${a * n - 1}x^${n - 1}`
                    ]),
                    difficulty: 12,
                    hint: `Power rule: d/dx[x^n] = nx^(n-1)`
                };
            }
        }
    ]
};

// Helper to get questions for a specific grade
QuestionTemplates.getQuestionsForGrade = function(grade) {
    const gradeKey = grade === 0 ? 'kindergarten' : `grade${grade}`;
    return this[gradeKey] || [];
};

// Make QuestionTemplates globally available
window.QuestionTemplates = QuestionTemplates;
