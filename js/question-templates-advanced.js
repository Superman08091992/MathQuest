/**
 * Math Quest 2.4: Additional procedurally generated, grade-scoped skills.
 * Every template owns its answer key; options are derived from that key and
 * checked by regression tests. Grade mappings are editorial groupings, not
 * claims of alignment with a specific state's curriculum standards.
 */
const QuestionTemplatesAdvanced = (() => {
    const banks = Array.from({ length: 13 }, () => []);
    const randint = (a, b) => Utils.randomInt(a, b);
    const pick = values => Utils.randomPick(values);
    const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
    const int = (value, text, hint, step = 1, min = -Infinity) => {
        const answer = Number(value);
        const offsets = [-3, -2, -1, 1, 2, 3, 4, 5, 6, -4, -5];
        const options = [answer];
        for (const offset of Utils.shuffleArray(offsets)) {
            const wrong = Number((answer + offset * step).toFixed(5));
            if (wrong >= min && !options.includes(wrong)) options.push(wrong);
            if (options.length === 4) break;
        }
        if (options.length !== 4) throw new Error(`Cannot create choices: ${text}`);
        return { text, answer, answers: Utils.shuffleArray(options), hint };
    };
    const choice = (text, answer, wrong, hint) => {
        const candidates = [String(answer), ...wrong.map(String)];
        if (new Set(candidates).size < 4 || !candidates.slice(1).every(v => v !== String(answer))) {
            throw new Error(`Invalid multiple choice: ${text}`);
        }
        return { text, answer: String(answer), answers: Utils.shuffleArray(candidates.slice(0, 4)), hint };
    };
    const add = (grade, category, type, generate) => {
        banks[grade].push({ type, category, skill: type, generate() {
            const q = generate();
            return { ...q, difficulty: grade === 0 ? 1 : grade };
        } });
    };
    const ratio = (a, b) => `${a / gcd(a, b)}/${b / gcd(a, b)}`;

    // Kindergarten: numbers, shape recognition, comparisons and simple patterns.
    add(0,'arithmetic','compare_numbers',()=>{const a=randint(0,9),b=randint(0,9);return choice(`Which number is greater: ${a} or ${b}?`, a>b?String(a):b>a?String(b):'They are equal', [a>b?String(b):b>a?String(a):String(a), 'Both are 10', 'Neither number'], 'Compare the number of objects each number represents.');});
    add(0,'arithmetic','missing_addend_to_ten',()=>{const a=randint(1,9);return int(10-a,`${a} + ? = 10`,'Count up from the first number until you reach 10.',1,0);});
    add(0,'arithmetic','take_away_objects',()=>{const a=randint(3,9),b=randint(1,a);return int(a-b,`You have ${a} apples and eat ${b}. How many are left?`,'Start with the total and count backwards.',1,0);});
    add(0,'arithmetic','number_before',()=>{const n=randint(2,20);return int(n-1,`What number comes just before ${n}?`,'Count backwards by one.',1,0);});
    add(0,'arithmetic','number_after',()=>{const n=randint(0,19);return int(n+1,`What number comes just after ${n}?`,'Count forwards by one.',1,0);});
    add(0,'arithmetic','count_by_twos',()=>{const n=randint(1,9)*2;return int(n+2,`Complete the pattern: ${n-2}, ${n}, ?`,'The numbers increase by two.',2,0);});
    add(0,'geometry','shape_sides',()=>{const [name,count]=pick([['triangle',3],['square',4],['pentagon',5],['hexagon',6]]);return int(count,`How many sides does a ${name} have?`,'Trace the straight edges.',1,0);});
    add(0,'arithmetic','tens_and_ones',()=>{const tens=randint(1,2),ones=randint(0,9);return int(tens*10+ones,`${tens} ten${tens===1?'':'s'} and ${ones} ones make which number?`,'A ten is worth 10 ones.',1,0);});

    // Grade 1.
    add(1,'arithmetic','addition_three_terms',()=>{const a=randint(1,6),b=randint(1,6),c=randint(1,6);return int(a+b+c,`${a} + ${b} + ${c} = ?`,'Add two numbers, then the third.',1,0);});
    add(1,'arithmetic','one_less_ten_more',()=>{const n=randint(10,79);return int(n+10,`What is 10 more than ${n}?`,'Increase the tens digit by one.',1,0);});
    add(1,'arithmetic','missing_subtrahend',()=>{const a=randint(5,20),b=randint(1,a);return int(b,`${a} − ? = ${a-b}`,'How much was taken away?',1,0);});
    add(1,'arithmetic','place_value_tens',()=>{const n=randint(10,99);return int(Math.floor(n/10),`How many full tens are in ${n}?`,'Count groups of ten.',1,0);});
    add(1,'arithmetic','double_a_number',()=>{const a=randint(1,10);return int(a*2,`Double ${a}. What do you get?`,'Double means add a number to itself.',1,0);});
    add(1,'arithmetic','skip_count_by_five',()=>{const n=5*randint(1,12);return int(n+5,`Complete: ${n-5}, ${n}, ?`,'Add five each time.',5,0);});
    add(1,'geometry','rectangle_vertices',()=>choice('How many corners does a rectangle have?','4',['3','5','6'],'Count the points where the sides meet.'));
    add(1,'arithmetic','sum_vs_difference',()=>{const a=randint(2,9),b=randint(1,a);return int(a+b-(a-b),`How much greater is ${a} + ${b} than ${a} − ${b}?`,'Find both answers, then subtract.',1,0);});

    // Grade 2.
    add(2,'arithmetic','subtract_within100',()=>{const a=randint(30,99),b=randint(5,a);return int(a-b,`${a} − ${b} = ?`,'Subtract the tens and ones.',1,0);});
    add(2,'arithmetic','three_digit_addition',()=>{const a=randint(100,399),b=randint(30,199);return int(a+b,`${a} + ${b} = ?`,'Add hundreds, tens, then ones.',1,0);});
    add(2,'arithmetic','hundreds_tens_ones',()=>{const a=randint(1,9),b=randint(0,9),c=randint(0,9);return int(100*a+10*b+c,`${a} hundreds, ${b} tens, and ${c} ones equal what number?`,'Use place value.',1,0);});
    add(2,'arithmetic','multiples_2_5_10',()=>{const a=pick([2,5,10]),b=randint(2,12);return int(a*b,`${b} groups of ${a} = ?`,'Skip-count in groups.',a,0);});
    add(2,'arithmetic','money_cents',()=>{const quarters=randint(0,3),dimes=randint(0,3),nickels=randint(0,3);const total=25*quarters+10*dimes+5*nickels;return int(total,`How many cents are ${quarters} quarters, ${dimes} dimes and ${nickels} nickels?`,'A quarter is 25 cents, a dime 10, and a nickel 5.',5,0);});
    add(2,'arithmetic','round_to_nearest_ten',()=>{const n=randint(11,189);return int(Math.round(n/10)*10,`Round ${n} to the nearest ten.`,'Ones of five or more round up.',10,0);});
    add(2,'geometry','perimeter_unit_squares',()=>{const a=randint(2,12),b=randint(2,12);return int(2*(a+b),`A rectangle has sides ${a} cm and ${b} cm. What is its perimeter in cm?`,'Add all four sides.',2,0);});
    add(2,'arithmetic','hours_to_minutes',()=>{const hours=randint(1,5);return int(hours*60,`How many minutes are in ${hours} hours?`,'There are 60 minutes in one hour.',60,0);});

    // Grade 3.
    add(3,'arithmetic','three_digit_subtraction',()=>{const a=randint(210,990),b=randint(30,a-5);return int(a-b,`${a} − ${b} = ?`,'Line up the hundreds, tens, and ones.',1,0);});
    add(3,'arithmetic','round_to_hundred',()=>{const n=randint(120,980);return int(Math.round(n/100)*100,`Round ${n} to the nearest hundred.`,'Look at the tens digit.',100,0);});
    add(3,'arithmetic','fraction_of_group',()=>{const d=pick([2,3,4,5,6,8]),groups=randint(2,12),n=randint(1,d-1);return int(n*groups,`What is ${n}/${d} of ${d*groups}?`,'Divide by the denominator, then multiply by the numerator.',1,0);});
    add(3,'geometry','rectangle_perimeter',()=>{const a=randint(3,25),b=randint(3,25);return int(2*(a+b),`Find the perimeter of a ${a} m by ${b} m rectangle.`,'Perimeter is twice length plus twice width.',2,0);});
    add(3,'arithmetic','division_story',()=>{const a=randint(2,12),b=randint(2,12);return int(a,`${a*b} stickers are shared equally among ${b} children. How many does each receive?`,'Divide the total by the number of children.',1,0);});
    add(3,'arithmetic','multiply_by_ten',()=>{const a=randint(11,99);return int(a*10,`${a} × 10 = ?`,'Multiplying by 10 shifts digits one place.',10,0);});
    add(3,'geometry','parallel_sides',()=>choice('How many pairs of opposite sides are parallel in a rectangle?','2',['0','1','4'],'Check the top and bottom, then the left and right.'));
    add(3,'arithmetic','division_remainder',()=>{const divisor=randint(3,9),quotient=randint(2,9),remainder=randint(1,divisor-1);return int(remainder,`What is the remainder when ${divisor*quotient+remainder} is divided by ${divisor}?`,'Subtract the largest multiple of the divisor.',1,0);});

    // Grade 4.
    add(4,'arithmetic','long_division_exact',()=>{const a=randint(12,99),b=randint(2,12);return int(a,`${a*b} ÷ ${b} = ?`,'The quotient times the divisor gives the dividend.',1,0);});
    add(4,'arithmetic','four_digit_addition',()=>{const a=randint(1000,8000),b=randint(1000,7000);return int(a+b,`${a} + ${b} = ?`,'Align place values to add.',1,0);});
    add(4,'arithmetic','multi_digit_subtraction',()=>{const a=randint(2500,9999),b=randint(1000,a);return int(a-b,`${a} − ${b} = ?`,'Regroup place values when needed.',1,0);});
    add(4,'arithmetic','fraction_compare_equal_denominator',()=>{const d=randint(3,12),a=randint(1,d-1),b=randint(1,d-1);return choice(`Compare ${a}/${d} and ${b}/${d}.`,a>b?'>':a<b?'<':'=',[a>b?'<':a<b?'>':'<',a===b?'>':'=', 'not comparable'],'With equal denominators, compare numerators.');});
    add(4,'geometry','missing_rectangle_side',()=>{const width=randint(3,20),length=randint(3,20);return int(length,`A rectangle has perimeter ${2*(width+length)} cm and width ${width} cm. Find its length.`,'Half the perimeter equals length plus width.',1,0);});
    add(4,'arithmetic','multiply_two_digit_numbers',()=>{const a=randint(12,39),b=randint(12,39);return int(a*b,`${a} × ${b} = ?`,'Use the distributive property.',5,0);});
    add(4,'arithmetic','prime_or_composite',()=>{const n=randint(2,80);let prime=true;for(let k=2;k*k<=n;k++)if(n%k===0){prime=false;break;}return choice(`Is ${n} prime or composite?`,prime?'Prime':'Composite',[prime?'Composite':'Prime','Neither (it is zero)','Both'],'A prime number has exactly two positive factors.');});
    add(4,'arithmetic','equivalent_fractions',()=>{const d=randint(2,9),n=randint(1,d-1),factor=randint(2,6);return choice(`Which fraction is equivalent to ${n}/${d}?`,`${n*factor}/${d*factor}`,[`${n*factor+1}/${d*factor}`,`${n*factor}/${d*factor+1}`,`${n*factor+2}/${d*factor}`],'Multiply numerator and denominator by the same number.');});

    // Grade 5.
    add(5,'arithmetic','fraction_add_same_denominator',()=>{const d=randint(3,15),a=randint(1,d-1),b=randint(1,d-1);const x=ratio(a+b,d);return choice(`Simplify: ${a}/${d} + ${b}/${d}`,x,[`${a+b+1}/${d}`,`${a+b}/${d+1}`,`${a+b+2}/${d}`],'Add numerators and simplify the result.');});
    add(5,'arithmetic','multiply_decimal_tenths',()=>{const a=randint(2,49),b=randint(2,49);const answer=a*b/100;return int(answer,`${(a/10).toFixed(1)} × ${(b/10).toFixed(1)} = ?`,'Multiply the integers, then place two decimal digits.',0.1,0);});
    add(5,'arithmetic','order_of_operations',()=>{const a=randint(2,20),b=randint(2,10),c=randint(2,10);return int(a+b*c,`${a} + ${b} × ${c} = ?`,'Multiply before adding.',1,0);});
    add(5,'arithmetic','calculate_mean',()=>{const a=randint(3,30),b=randint(3,30),c=randint(3,30);const nums=[a,b,c].sort((x,y)=>x-y);return int(nums[1],`What is the median of ${a}, ${b}, and ${c}?`,'Order the numbers from least to greatest and take the middle value.',1,0);});
    add(5,'arithmetic','calculate_average',()=>{const a=randint(2,20),b=randint(2,20),c=randint(2,20);return int((a+b+c),`Three test scores are ${a*3}, ${b*3}, and ${c*3}. What is their average?`,'Sum the scores and divide by three.',1,0);});
    add(5,'geometry','coordinate_distance_axis',()=>{const x1=randint(-10,0),x2=randint(1,10);return int(x2-x1,`Points (${x1}, 4) and (${x2}, 4) are how many units apart?`,'Subtract their x-coordinates.',1,0);});
    add(5,'arithmetic','centimeters_to_meters',()=>{const m=randint(2,50);return int(m,`Convert ${m*100} centimeters to meters.`,'There are 100 centimeters in one meter.',1,0);});
    add(5,'arithmetic','percent_as_decimal',()=>{const p=randint(5,95);return choice(`Write ${p}% as a decimal.`,(p/100).toFixed(2),[(p/10).toFixed(2),(p/1000).toFixed(3),(p/100+0.01).toFixed(2)],'Percent means per hundred.');});

    // Grade 6.
    add(6,'arithmetic','integer_addition',()=>{const a=randint(-35,35),b=randint(-35,35);return int(a+b,`${a} + (${b}) = ?`,'Use the number line and sign rules.');});
    add(6,'arithmetic','integer_subtraction',()=>{const a=randint(-35,35),b=randint(-35,35);return int(a-b,`${a} − (${b}) = ?`,'Subtracting a number means adding its opposite.');});
    add(6,'arithmetic','fraction_multiply',()=>{const a=randint(1,8),b=randint(2,12),c=randint(1,8),d=randint(2,12);const correct=ratio(a*c,b*d);return choice(`Simplify: ${a}/${b} × ${c}/${d}`,correct,[`${a*c+1}/${b*d}`,`${a*c}/${b*d+1}`,`${a*c+2}/${b*d}`],'Multiply numerators and denominators, then reduce.');});
    add(6,'arithmetic','discount_price',()=>{const price=randint(5,40)*10,percent=pick([10,20,25,50]);return int(price*(100-percent)/100,`A $${price} item is ${percent}% off. What is the sale price in dollars?`,'Subtract the discount from the original price.',1,0);});
    add(6,'geometry','triangle_area',()=>{const base=randint(2,20),height=randint(2,20);return int(base*height/2,`Find the area of a triangle with base ${base} cm and height ${height} cm.`,'A = base × height ÷ 2.',0.5,0);});
    add(6,'algebra','evaluate_linear_expression',()=>{const x=randint(-7,12),a=randint(2,9),b=randint(-10,15);return int(a*x+b,`Evaluate ${a}x + (${b}) when x = ${x}.`,'Substitute the value for x.');});
    add(6,'arithmetic','unit_rate',()=>{const amount=randint(3,25),units=randint(2,12);return int(amount,`${units} identical notebooks cost $${amount*units}. What is the price per notebook?`,'Divide total cost by the number of notebooks.',1,0);});
    add(6,'arithmetic','least_common_multiple',()=>{const a=randint(2,10),b=randint(2,10);const lcm=a*b/gcd(a,b);return int(lcm,`Find the least common multiple of ${a} and ${b}.`,'List multiples until you find the first common one.',1,0);});

    // Grade 7.
    add(7,'algebra','solve_negative_linear',()=>{const x=randint(-20,20),a=randint(2,9),b=randint(-20,20);return int(x,`Solve ${a}x + (${b}) = ${a*x+b}.`,'Subtract the constant and divide by the coefficient.');});
    add(7,'arithmetic','proportion_missing_value',()=>{const a=randint(2,15),b=randint(2,15),k=randint(2,15);return int(b*k,`If ${a} items cost $${b}, what do ${a*k} items cost when the price is proportional?`,'Scale both quantities by the same factor.',b,0);});
    add(7,'arithmetic','proportion_cost',()=>{const units=randint(2,12),each=randint(2,25),target=randint(3,15);return int(each*target,`${units} markers cost $${each*units}. What is the cost of ${target} markers at the same rate?`,'Find the price per marker, then multiply.',1,0);});
    add(7,'arithmetic','probability_single_event',()=>{const total=pick([4,5,6,8,10,12]),favorable=randint(1,total-1);return choice(`A bag has ${favorable} red and ${total-favorable} blue marbles. P(red), simplified?`,ratio(favorable,total),[`${favorable}/${total+1}`,`${favorable+1}/${total}`,`${favorable+2}/${total+2}`],'Probability = favorable outcomes / all outcomes.');});
    add(7,'geometry','circumference_pi',()=>{const r=randint(2,50);return int(2*r,`What is the circumference of a circle of radius ${r}, in units of π? (Enter coefficient of π.)`,'C = 2πr.',2,0);});
    add(7,'algebra','distribute_negative',()=>{const a=randint(2,9),b=randint(1,12);return choice(`Expand −${a}(x + ${b}).`,`−${a}x − ${a*b}`,[`−${a}x + ${a*b}`,`${a}x − ${a*b}`,`−${a}x − ${b}`],'Multiply both terms by the negative number.');});
    add(7,'arithmetic','tax_percent',()=>{const price=randint(2,30)*10,rate=pick([5,10,15]);return int(price*rate/100,`How many dollars of ${rate}% tax are added to a $${price} item?`,'Tax amount = rate × original price.',1,0);});
    add(7,'algebra','solve_ratio_equation',()=>{const a=randint(2,12),b=randint(2,12);return int(a*b,`Solve x/${a} = ${b}. What is x?`,'Multiply both sides by the denominator.',1,0);});

    // Grade 8.
    add(8,'algebra','linear_function_evaluate',()=>{const x=randint(-10,10),m=randint(-8,8),b=randint(-12,12);return int(m*x+b,`If f(x) = ${m}x + (${b}), find f(${x}).`,'Substitute the input into the function.');});
    add(8,'algebra','slope_intercept',()=>{const slope=randint(-9,9),b=randint(-15,15);return int(b,`What is the y-intercept of y = ${slope}x + (${b})?`,'At the y-intercept, x is zero.');});
    add(8,'algebra','scientific_notation',()=>{const mantissa=randint(2,9),power=randint(2,6);return int(mantissa*10**power,`What is ${mantissa} × 10^${power} in standard form?`,'Shift the decimal point right.',10**power,0);});
    add(8,'algebra','square_roots',()=>{const n=randint(5,30);return int(n,`√${n*n} = ?`,'A square root is the nonnegative number whose square matches the radicand.',1,0);});
    add(8,'geometry','pythagorean_missing_leg',()=>{const [a,b,c]=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41]]);return int(b,`A right triangle has a hypotenuse of ${c} and one leg of ${a}. Find the other leg.`,'Other leg = √(hypotenuse² − known leg²).',1,0);});
    add(8,'algebra','solve_linear_system_value',()=>{const x=randint(-10,10),y=randint(-10,10);return int(x,`Find x: x + y = ${x+y}, x − y = ${x-y}`,'Add the equations and divide by two.');});
    add(8,'geometry','reflection_over_y',()=>{const x=randint(1,12),y=randint(1,12)*pick([-1,1]);return choice(`Reflect the point (${x}, ${y}) over the y-axis.`,`(${-x}, ${y})`,[`(${x}, ${-y})`,`(${x}, ${y})`,`(${-x}, ${-y})`],'Flip the sign of x, keeping y the same.');});
    add(8,'algebra','exponent_product_rule',()=>{const a=randint(2,10),b=randint(2,10);return int(a+b,`Simplify x^${a} × x^${b}. What is the exponent?`,'Add exponents with the same base.',1,0);});

    // Grade 9.
    add(9,'algebra','quadratic_factoring',()=>{const a=randint(1,12),b=randint(1,12);return choice(`Factor x² + ${a+b}x + ${a*b}.`,`(x + ${a})(x + ${b})`,[`(x + ${a+1})(x + ${b})`,`(x − ${a})(x − ${b})`,`(x + ${a})(x − ${b})`],'Find two numbers whose sum and product match the coefficients.');});
    add(9,'algebra','solve_quadratic_square',()=>{const x=randint(2,20);return choice(`Solve x² = ${x*x}. What are all real solutions?`,`±${x}`,[`${x}` ,`−${x}`,`±${x+1}`],'Both a positive number and its negative have the same square.');});
    add(9,'algebra','linear_inequality',()=>{const x=randint(-10,10),a=randint(2,9);return choice(`Solve: ${a}x > ${a*x}`,`x > ${x}`,[`x < ${x}`,`x ≥ ${x}`,`x > ${x+1}`],'Divide by the positive coefficient.');});
    add(9,'algebra','binomial_multiply_middle',()=>{const a=randint(2,20),b=randint(2,20);return int(a+b,`In (x + ${a})(x + ${b}), what is the coefficient of x?`,'Combine the two cross products.',1,0);});
    add(9,'algebra','vertex_of_parabola',()=>{const h=randint(-12,12),k=randint(-12,12);return int(h,`The graph of y = (x − (${h}))² + (${k}). What is the x-coordinate of its vertex?`,'In vertex form, h is the horizontal coordinate.');});
    add(9,'algebra','function_output',()=>{const x=randint(-12,12),a=randint(2,7),b=randint(-20,20);return int(a*x*x+b,`For f(x) = ${a}x² + (${b}), find f(${x}).`,'Substitute x, square it, multiply, then add.');});
    add(9,'geometry','line_midpoint',()=>{const x=randint(-15,15),y=randint(-15,15),dx=randint(1,10),dy=randint(1,10);return choice(`Find the midpoint of (${x-dx}, ${y-dy}) and (${x+dx}, ${y+dy}).`,`(${x}, ${y})`,[`(${x+1}, ${y})`,`(${x}, ${y+1})`,`(${x+dx}, ${y+dy})`],'Average both x-coordinates and both y-coordinates.');});
    add(9,'algebra','power_of_power',()=>{const a=randint(2,12),b=randint(2,10);return int(a*b,`In (x^${a})^${b}, what exponent does x have?`,'Multiply the exponents.',1,0);});

    // Grade 10.
    add(10,'geometry','triangle_angle_sum',()=>{const a=randint(20,80),b=randint(20,150-a);return int(180-a-b,`Two interior angles of a triangle are ${a}° and ${b}°. Find the third angle.`,'Interior triangle angles total 180 degrees.',1,0);});
    add(10,'geometry','similar_triangles',()=>{const small=randint(3,15),factor=randint(2,9);return int(small*factor,`A side of a triangle is ${small} cm. A similar triangle is ${factor} times larger. Find the matching side.`,'Matching lengths share the same scale factor.',1,0);});
    add(10,'geometry','distance_on_plane',()=>{const [a,b,c]=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41]]);const n=randint(1,3);return int(c*n,`Find the distance between (0, 0) and (${a*n}, ${b*n}).`,'Use √(change in x squared + change in y squared).',1,0);});
    add(10,'geometry','polygon_angle_sum',()=>{const sides=randint(4,12);return int((sides-2)*180,`What is the sum of interior angles of a ${sides}-sided polygon, in degrees?`,'Sum = (number of sides − 2) × 180.',180,0);});
    add(10,'geometry','circle_sector_pi',()=>{const r=randint(2,15),fraction=pick([2,4]);const num=r*r/fraction;return int(num,`A circle has radius ${r}. For a ${360/fraction}° sector, what is the area coefficient of π?`,'Sector area is the appropriate fraction of πr².',0.25,0);});
    add(10,'geometry','right_triangle_leg',()=>{const [a,b,c]=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41]]);return int(a,`A right triangle has one leg ${b} and hypotenuse ${c}. Find the other leg.`,'Use the Pythagorean theorem.',1,0);});
    add(10,'trigonometry','tangent_ratio',()=>{const [a,b]=pick([[3,4],[5,12],[8,15],[7,24],[9,40]]);return choice(`In a right triangle with opposite side ${a} and adjacent side ${b}, what is tan(θ)?`,ratio(a,b),[`${b}/${a}`,`${a}/${a+b}`,`${a+b}/${b}`],'tan(θ) = opposite / adjacent.');});
    add(10,'geometry','regular_polygon_exterior',()=>{const n=pick([3,4,5,6,8,9,10,12]);return int(360/n,`Each exterior angle of a regular ${n}-gon is how many degrees?`,'All exterior angles sum to 360°.',5,0);});

    // Grade 11.
    add(11,'algebra','geometric_sequence_nth',()=>{const a=randint(2,12),ratioValue=randint(2,5),n=randint(3,6);return int(a*ratioValue**(n-1),`Find term ${n} of the geometric sequence ${a}, ${a*ratioValue}, ${a*ratioValue**2}, ...`,'n-th term = first × ratio^(n − 1).',1,0);});
    add(11,'algebra','complex_add_real',()=>{const a=randint(-20,20),b=randint(-20,20),c=randint(-20,20),d=randint(-20,20);return int(a+c,`What is the real part of (${a} + ${b}i) + (${c} + ${d}i)?`,'Add the real parts separately from imaginary parts.');});
    add(11,'algebra','complex_multiply_i',()=>{const a=randint(2,25);return int(-a,`Simplify the real number ${a}i².`,'i² = −1.');});
    add(11,'algebra','log_change_form',()=>{const base=randint(2,9),x=randint(2,6);return int(x,`Evaluate log base ${base} of ${base**x}.`,'A logarithm undoes exponentiation.',1,0);});
    add(11,'algebra','inverse_function_linear',()=>{const m=randint(2,9),x=randint(-10,10),b=randint(-20,20);return int(x,`If f(x) = ${m}x + (${b}), find f⁻¹(${m*x+b}).`,'Undo addition, then undo multiplication.');});
    add(11,'algebra','composition_linear',()=>{const x=randint(-7,10),m=randint(2,6),n=randint(1,12);return int(m*(x+n),`Let f(x) = ${m}x and g(x) = x + ${n}. Find f(g(${x})).`,'Apply g first, then f.');});
    add(11,'arithmetic','factorial_ratio',()=>{const n=randint(4,12);return int(n*(n-1),`Evaluate ${n}! / (${n-2})!.`,'Cancel common factors of the factorials.',1,0);});
    add(11,'algebra','exponential_power_law',()=>{const a=randint(2,10),b=randint(1,a-1);return int(a-b,`When x^${a} is divided by x^${b} (x ≠ 0), what exponent remains?`,'Subtract exponents with the same base.',1,0);});

    // Grade 12.
    add(12,'calculus','derivative_value',()=>{const a=randint(2,10),n=randint(2,5),x=randint(1,5);return int(a*n*x**(n-1),`For f(x) = ${a}x^${n}, find f′(${x}).`,'Differentiate using the power rule, then substitute.',1,0);});
    add(12,'calculus','limit_removable',()=>{const a=randint(2,25);return int(2*a,`Evaluate lim x→${a} of (x² − ${a*a})/(x − ${a}).`,'Factor a difference of squares and cancel the common factor.',2,0);});
    add(12,'calculus','definite_integral_linear',()=>{const a=randint(2,10),bound=randint(2,10);return int(a*bound*bound/2,`Evaluate ∫ from 0 to ${bound} of ${a}x dx.`,'An antiderivative is a×x²/2.',0.5,0);});
    add(12,'calculus','derivative_sum_constant',()=>{const a=randint(2,12),b=randint(-20,20),x=randint(1,10);return int(2*a*x+b,`For f(x) = ${a}x² + (${b})x + 9, find f′(${x}).`,'Differentiate term by term.',1);});
    add(12,'trigonometry','degrees_to_radians_pi',()=>{const d=pick([30,45,60,90,120,135,150,180,210,225,240,270,300,330,360]);return choice(`Express ${d}° in radians, as a multiple of π.`,ratio(d,180),[ratio(d+30,180),ratio(d+60,180),ratio(d+90,180)],'Degrees × π/180 gives radians.');});
    add(12,'geometry','vector_magnitude',()=>{const [a,b,c]=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41]]),m=randint(1,5);return int(m*c,`Find the magnitude of vector (${m*a}, ${m*b}).`,'Magnitude = √(x² + y²).',1,0);});
    add(12,'arithmetic','expected_value_die',()=>{const a=randint(1,15),b=randint(1,15);return int((a+b)/2,`A fair coin pays ${a} points on heads and ${b} on tails. What is the expected number of points?`,'Average the two equally likely outcomes.',0.5,0);});
    add(12,'calculus','slope_at_x_constant',()=>{const m=randint(-20,20),b=randint(-20,20),x=randint(-10,10);return int(m,`What is the derivative at x = ${x} of f(x) = ${m}x + (${b})?`,'The slope of a linear function is its x coefficient.');});


    // Additional depth for the smallest and most repetitive banks.
    add(0,'arithmetic','make_number_from_parts',()=>{const n=randint(4,15),a=randint(0,n-1);return int(n-a,`Fill the missing part: ${n} = ${a} + ?`,'Find how much must be added to reach the total.',1,0);});
    add(0,'arithmetic','compare_small_sum',()=>{const a=randint(1,5),b=randint(1,5),c=randint(2,12);return choice(`Is ${a} + ${b} greater than, less than, or equal to ${c}?`,a+b>c?'Greater than':a+b<c?'Less than':'Equal to', ['Greater than','Less than','Equal to','Not a number'].filter(x=>x!==(a+b>c?'Greater than':a+b<c?'Less than':'Equal to')),'Add the first two numbers before comparing.');});
    add(0,'arithmetic','two_number_total',()=>{const a=randint(1,10),b=randint(1,10);return int(a+b,`There are ${a} red blocks and ${b} green blocks. How many blocks in all?`,'Combine the two groups and count.',1,0);});
    add(0,'geometry','identify_shape_by_corners',()=>{const [name,corners]=pick([['triangle',3],['square',4],['pentagon',5],['hexagon',6]]);return choice(`Which shape has ${corners} corners?`,name,['circle','rectangle','octagon','line','hexagon','triangle','pentagon','square'].filter(v=>v!==name && (corners!==4 || v!=='rectangle') && (corners!==3 || v!=='triangle') && (corners!==5 || v!=='pentagon') && (corners!==6 || v!=='hexagon')).slice(0,3),'Count the corners of each shape.');});

    // Grade 10: expand beyond a handful of fixed triangles and angles.
    add(10,'geometry','cylinder_volume_pi',()=>{const r=randint(2,50),h=randint(3,60);return int(r*r*h,`A cylinder has radius ${r} cm and height ${h} cm. What is its volume coefficient of π, in cm³?`,'V = πr²h.',1,0);});
    add(10,'geometry','prism_surface_area',()=>{const a=randint(3,50),b=randint(3,50),c=randint(3,50);return int(2*(a*b+b*c+a*c),`Find the surface area of a ${a} × ${b} × ${c} rectangular prism.`,'Surface area = 2(lw + lh + wh).',2,0);});
    add(10,'geometry','trapezoid_area',()=>{const a=randint(5,90),b=randint(5,90),h=randint(2,40);return int((a+b)*h/2,`A trapezoid has parallel bases ${a} cm and ${b} cm and height ${h} cm. Find its area.`,'Area = (base 1 + base 2) × height / 2.',0.5,0);});
    add(10,'geometry','perimeter_scaling',()=>{const a=randint(3,70),b=randint(3,70),k=randint(2,12);return int(2*(a+b)*k,`A rectangle is ${a} cm by ${b} cm. What is the perimeter of a similar rectangle with scale factor ${k}?`,'Scale all lengths, including the perimeter.',2,0);});
    add(10,'geometry','area_scale_factor',()=>{const a=randint(3,50),b=randint(3,50),k=randint(2,9);return int(a*b*k*k,`A ${a} by ${b} rectangle is enlarged by scale factor ${k}. What is the new area?`,'Area increases by the square of the scale factor.',1,0);});
    add(10,'geometry','point_distance_horizontal',()=>{const a=randint(-80,-1),b=randint(1,80),y=randint(-50,50);return int(b-a,`What is the distance from (${a}, ${y}) to (${b}, ${y})?`,'With equal y-coordinates, subtract x-coordinates.',1,0);});
    add(10,'algebra','line_y_intercept_from_point',()=>{const m=randint(-15,15),x=randint(-20,20),b=randint(-30,30);return int(b,`A line has slope ${m} and passes through (${x}, ${m*x+b}). Find its y-intercept.`,'Substitute the point into y = mx + b.');});
    add(10,'geometry','area_right_triangle_coordinates',()=>{const a=randint(2,65),b=randint(2,65),x=randint(-20,20),y=randint(-20,20);return int(a*b/2,`Find the area of the triangle with vertices (${x}, ${y}), (${x+a}, ${y}), and (${x}, ${y+b}).`,'Two legs are perpendicular. Area = base × height / 2.',0.5,0);});
    add(10,'geometry','cone_volume_coefficient_pi',()=>{const r=randint(3,40),h=3*randint(1,20);return int(r*r*h/3,`A cone has radius ${r} cm and height ${h} cm. What is the coefficient of π in its volume?`,'V = (1/3)πr²h.',1/3,0);});
    add(10,'geometry','sector_arc_length_pi',()=>{const part=pick([2,3,4,6]),r=part*randint(1,Math.floor(60/part));return int(2*r/part,`A circle has radius ${r} cm. For an arc spanning ${360/part}°, what is the arc length coefficient of π?`,'Arc length = 2πr × angle/360.',1/6,0);});

    return { getQuestionsForGrade(grade) { return banks[grade] ? [...banks[grade]] : []; }, count: banks.reduce((sum, bank) => sum + bank.length, 0) };
})();
window.QuestionTemplatesAdvanced = QuestionTemplatesAdvanced;
