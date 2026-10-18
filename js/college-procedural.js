/** Parameterized college-readiness practice: independent skills and explainable solutions. */
const CollegeProcedural = (() => {
    const items = [], ri = (a,b) => Utils.randomInt(a,b), pick = x => Utils.randomPick(x);
    const gcd = (a,b) => b ? gcd(b,a%b):Math.abs(a);
    const frac = (a,b) => `${a/gcd(a,b)}/${b/gcd(a,b)}`;
    const n = (text, value, explanation, {step=1,min=-Infinity,decimals=5}={}) => {
        if (!Number.isFinite(value)) throw Error('Invalid computed key: '+text);
        const key = Number(value.toFixed(decimals));
        const opts = [key];
        for(const delta of Utils.shuffleArray([-5,-3,-2,-1,1,2,3,4,5,7,10,-7,11,-11])) {
            const v = Number((key + delta*step).toFixed(decimals));
            if(v>=min && !opts.includes(v)) opts.push(v);
            if(opts.length===4) break;
        }
        if(opts.length!==4) throw Error('Insufficient numerical choices '+text);
        return {text,answer:key,answers:Utils.shuffleArray(opts),hint:explanation,explanation};
    };
    const c = (text,answer,wrong,explanation)=>{
        const options = [String(answer),...wrong.map(String)];
        if(options.length!==4 || new Set(options).size!==4) throw Error('Invalid answer choices for '+text+': '+options);
        return {text,answer:String(answer),answers:Utils.shuffleArray(options),hint:explanation,explanation};
    };
    const f = (text,top,bottom,explanation) => {
        const divisor=gcd(top,bottom),numerator=top/divisor,denominator=bottom/divisor;
        const correct=`${numerator}/${denominator}`;
        const wrong=[1,2,3].map(d=>`${numerator+d}/${denominator}`);
        return c(text,correct,wrong,explanation);
    };
    const add=(g,cat,skill,fn)=>items.push(Object.freeze({type:`college_proc_${g}_${skill}`,category:cat,skill,isFixed:false,gradeMin:g,gradeMax:Math.min(12,g+1),generate(){return {...fn(),difficulty:Math.max(1,g),sourceType:'original-procedural'};}}));

    // Kindergarten: operations and representation rather than memorized facts.
    add(0,'arithmetic','compose_ten',()=>{const a=ri(0,10);return n(`${a} counters are in a ten-frame. How many more fill it?`,10-a,`Ten minus ${a} gives the number missing.`,{min:0});});
    add(0,'arithmetic','order_three',()=>{const a=ri(1,6),b=a+ri(1,5),d=b+ri(1,5);return c(`Which list shows the numbers ${d}, ${a}, ${b} from least to greatest?`,`${a}, ${b}, ${d}`,[`${d}, ${b}, ${a}`,`${b}, ${a}, ${d}`,`${a}, ${d}, ${b}`],'The smallest is first and the largest is last.');});
    add(0,'arithmetic','compare_objects',()=>{const a=ri(2,8),b=ri(1,8);return c(`There are ${a} blue counters and ${b} red counters. Which has more?`,a>b?'Blue':a<b?'Red':'Same number',['Blue','Red','Same number','Neither exists'].filter(x=>x!==(a>b?'Blue':a<b?'Red':'Same number')).slice(0,3),'Compare the two quantities carefully.');});
    add(0,'geometry','shape_vertices',()=>{const [shape,v]=pick([['triangle',3],['square',4],['pentagon',5],['hexagon',6]]);return n(`How many corners does a ${shape} have?`,v,'Each place two sides meet is a corner.',{min:0});});
    add(0,'arithmetic','skip_one',()=>{const a=ri(1,16);return n(`Count forward: ${a}, ${a+1}, ${a+2}, ?`,a+3,'Each number is one more than the previous.',{min:0});});
    add(0,'arithmetic','count_back',()=>{const a=ri(5,15);return n(`Count backward: ${a}, ${a-1}, ${a-2}, ?`,a-3,'Subtract one each time.',{min:0});});

    // Grade 1: tens/ones, comparisons and operations.
    add(1,'arithmetic','missing_addend',()=>{const a=ri(3,14),b=ri(1,10);return n(`${a} + ? = ${a+b}`,b,'Subtract the known addend from the total.',{min:0});});
    add(1,'arithmetic','difference_word_problem',()=>{const a=ri(9,30),b=ri(1,a);return n(`A class has ${a} crayons and gives away ${b}. How many remain?`,a-b,'Subtract given crayons from the starting amount.',{min:0});});
    add(1,'arithmetic','tens_place',()=>{const a=ri(2,9),b=ri(0,9);return n(`In the number ${10*a+b}, how many tens are there?`,a,'The tens digit tells how many groups of ten.',{min:0});});
    add(1,'arithmetic','two_step_add',()=>{const a=ri(1,9),b=ri(1,9),d=ri(1,9);return n(`${a} + ${b} + ${d} = ?`,a+b+d,'Combine two addends, then add the third.',{min:0});});
    add(1,'arithmetic','time_one_hour',()=>{const h=ri(1,10);return n(`The clock shows ${h}:00. What hour will it be in one hour?`,h+1,'Move forward one hour.',{min:0});});
    add(1,'geometry','rectangle_sides',()=>c('How many straight sides does a rectangle have?','4',['3','5','6'],'A rectangle has four straight sides.'));

    // Grade 2: larger operations, early fractions and measurement.
    add(2,'arithmetic','sum_three_digits',()=>{const a=ri(100,400),b=ri(100,400);return n(`${a} + ${b} = ?`,a+b,'Add hundreds, tens and ones.');});
    add(2,'arithmetic','difference_three_digits',()=>{const a=ri(230,650),b=ri(25,180);return n(`${a} − ${b} = ?`,a-b,'Align place values and regroup when needed.',{min:0});});
    add(2,'arithmetic','fraction_one_half',()=>{const a=ri(2,50)*2;return n(`What is half of ${a}?`,a/2,'Divide the total into two equal parts.',{min:0});});
    add(2,'geometry','rectangle_perimeter_word',()=>{const a=ri(3,15),b=ri(3,15);return n(`A garden is ${a} m long and ${b} m wide. How many meters of fence surround it?`,2*(a+b),'A rectangle has two lengths and two widths.',{min:0});});
    add(2,'arithmetic','money_change',()=>{const paid=ri(6,25),cost=ri(1,paid-1);return n(`You pay $${paid} for a $${cost} item. How many dollars of change?`,paid-cost,'Change equals money paid minus price.',{min:0});});
    add(2,'arithmetic','minutes_to_hours',()=>{const h=ri(1,6);return n(`How many minutes are in ${h} hours?`,h*60,'Each hour contains 60 minutes.',{min:0,step:10});});

    // Grade 3: fractions and multi-step quantitative reasoning.
    add(3,'arithmetic','divide_equal_groups',()=>{const groups=ri(3,12),each=ri(3,15);return n(`${groups*each} books are put in ${groups} equal boxes. Books per box?`,each,'Divide the total by the number of equal groups.',{min:0});});
    add(3,'arithmetic','fraction_of_quantity',()=>{const den=pick([2,3,4,5,6,8]),unit=ri(2,20),num=ri(1,den-1);return n(`Find ${num}/${den} of ${den*unit}.`,unit*num,'Divide by denominator and multiply by numerator.',{min:0});});
    add(3,'geometry','area_fencing_compare',()=>{const a=ri(3,16),b=ri(3,16);return n(`A rectangular garden is ${a} m by ${b} m. What is its area in square meters?`,a*b,'Area is length times width.',{min:0});});
    add(3,'arithmetic','elapsed_minutes',()=>{const h=ri(1,9),minutes=pick([10,15,20,25,30,40]);return n(`A lesson begins at ${h}:00 and lasts ${minutes} minutes. How many minutes after the hour does it end?`,minutes,'Add the duration to the starting time.',{min:0,step:5});});
    add(3,'statistics','range_three',()=>{const a=ri(3,15),b=a+ri(2,10),d=b+ri(2,10);return n(`Find the range of scores ${a}, ${b}, ${d}.`,d-a,'Range = largest value minus smallest.',{min:0});});
    add(3,'arithmetic','round_to_tens',()=>{const a=ri(30,450);return n(`Round ${a} to the nearest ten.`,Math.round(a/10)*10,'Ones digit 5 or more rounds the tens up.',{min:0,step:10});});

    // Grade 4: fractional arithmetic, measurement and foundations of algebra.
    add(4,'arithmetic','fraction_equivalence',()=>{const num=ri(1,6),den=num+ri(1,6),k=ri(2,7);return c(`Which fraction is equivalent to ${num}/${den}?`,`${num*k}/${den*k}`,[`${num*k+1}/${den*k}`,`${num*k}/${den*k+1}`,`${num*k+2}/${den*k+1}`],'Multiply numerator and denominator by the same nonzero factor.');});
    add(4,'arithmetic','add_like_fractions',()=>{const den=ri(3,12),a=ri(1,den-1),b=ri(1,den-1);const correct=frac(a+b,den);return f(`Simplify ${a}/${den} + ${b}/${den}.`,a+b,den,'Same denominator: add numerators, then simplify.');});
    add(4,'arithmetic','decimal_comparison',()=>{const a=ri(11,98),b=a+ri(1,15);return c(`Which decimal is greater: ${(a/10).toFixed(1)} or ${(b/10).toFixed(1)}?`,(b/10).toFixed(1),[(a/10).toFixed(1),'They are equal','Cannot compare decimals'],'Compare place values, including the tenths.');});
    add(4,'algebra','unknown_multiplication',()=>{const a=ri(3,12),b=ri(4,18);return n(`${a} × x = ${a*b}. Find x.`,b,'Divide both sides by the known multiplier.',{min:0});});
    add(4,'geometry','rectangle_missing_side',()=>{const a=ri(5,30),b=ri(5,30);return n(`A rectangle has perimeter ${2*(a+b)} cm and width ${a} cm. Find its length.`,b,'Half the perimeter is width plus length.',{min:0});});
    add(4,'arithmetic','multi_digit_product',()=>{const a=ri(12,87),b=ri(12,75);return n(`${a} × ${b} = ?`,a*b,'Distribute using tens and ones.',{min:0,step:5});});
    add(4,'statistics','interpret_frequency',()=>{const [a,b,d]=[ri(4,15),ri(16,26),ri(27,40)];return n(`A chart shows ${a} red, ${b} blue, and ${d} green marbles. How many altogether?`,a+b+d,'Add all category frequencies.',{min:0});});

    // Grade 5: fractions, percent, volume and basic data interpretation.
    add(5,'arithmetic','multiply_unit_fraction',()=>{const a=ri(1,4),b=ri(a+1,10),d=ri(2,9);return f(`Simplify (${a}/${b}) × (${d}/${d+1}).`,a*d,b*(d+1),'Multiply numerators and denominators, then reduce.');});
    add(5,'arithmetic','percent_of_amount',()=>{const pct=pick([10,20,25,40,50,75]),amount=ri(2,20)*100;return n(`Find ${pct}% of ${amount}.`,pct*amount/100,'Convert percentage to a fraction out of 100.',{min:0,step:10});});
    add(5,'geometry','rectangular_volume',()=>{const a=ri(2,12),b=ri(2,12),d=ri(2,12);return n(`A rectangular box is ${a} cm by ${b} cm by ${d} cm. Volume in cubic cm?`,a*b*d,'Volume = length × width × height.',{min:0,step:5});});
    add(5,'statistics','weighted_mean',()=>{const a=ri(2,20),b=ri(2,20);return n(`Two scores are ${a} and ${b}. What is their average?`,(a+b)/2,'Add the two scores, then divide the sum by two.',{min:0,step:0.5});});
    add(5,'arithmetic','decimal_product',()=>{const a=ri(12,80),b=ri(2,9);return n(`${(a/10).toFixed(1)} × ${b} = ?`,a*b/10,'Multiply the integer parts, then place the decimal.',{min:0,step:0.1});});
    add(5,'geometry','polygon_angle_sum_intro',()=>{const sides=pick([3,4,5,6]);return n(`What is the sum of interior angles in a ${sides}-sided polygon, in degrees?`,(sides-2)*180,'Divide the polygon into (n − 2) triangles.',{min:0,step:90});});
    add(5,'statistics','median_five',()=>{const data=[ri(1,80),ri(1,80),ri(1,80),ri(1,80),ri(1,80)];return n(`Find the median of ${data.join(', ')}.`,[...data].sort((a,b)=>a-b)[2],'Order the five values and take the third.',{min:0});});

    // Grade 6: signed arithmetic, ratios and probability.
    add(6,'arithmetic','signed_product',()=>{const a=ri(-14,-2),b=ri(2,12);return n(`${a} × ${b} = ?`,a*b,'A negative times a positive is negative.');});
    add(6,'algebra','solve_linear',()=>{const a=ri(2,12),x=ri(-8,15),b=ri(-20,20);return n(`Solve ${a}x + (${b}) = ${a*x+b}.`,x,'Subtract the constant, then divide by the coefficient.');});
    add(6,'arithmetic','ratio_scale',()=>{const a=ri(2,9),b=ri(3,12),k=ri(2,9);return n(`The ratio of red to blue is ${a}:${b}. If there are ${a*k} red pieces, how many blue?`,b*k,'Scale both parts of the ratio by the same multiplier.',{min:0});});
    add(6,'statistics','probability_marbles',()=>{const red=ri(2,9),blue=ri(2,9);return f(`A bag contains ${red} red and ${blue} blue counters. Probability of red?`,red,red+blue,'Probability = favorable outcomes / total outcomes.');});
    add(6,'geometry','triangle_area',()=>{const base=ri(3,30),height=ri(2,30);return n(`Area of a triangle with base ${base} and perpendicular height ${height}?`,base*height/2,'Triangle area is half base times height.',{min:0,step:0.5});});
    add(6,'statistics','mean_four',()=>{const a=ri(1,20),b=ri(1,20),d=ri(1,20),e=ri(1,20);return n(`Find the mean of ${a}, ${b}, ${d}, ${e}.`,(a+b+d+e)/4,'Add the observations, then divide by four.',{min:0,step:0.25});});
    add(6,'arithmetic','percent_discount',()=>{const pct=pick([10,20,25,50]),price=ri(2,25)*20;return n(`A $${price} item is ${pct}% off. What is the sale price?`,price*(100-pct)/100,'Subtract the discount from original price.',{min:0,step:1});});

    // Grade 7: proportional relationships and scientific rate reasoning.
    add(7,'algebra','unit_rate',()=>{const per=ri(2,30),qty=ri(2,12);return n(`${qty} tickets cost $${qty*per}. Cost of one ticket?`,per,'Total cost divided by quantity is the unit rate.',{min:0});});
    add(7,'algebra','proportional_unknown',()=>{const per=ri(2,14),a=ri(3,12),b=ri(4,15);return n(`If ${a} kg cost $${a*per}, how many dollars do ${b} kg cost?`,b*per,'The unit price is constant in a proportional relationship.',{min:0});});
    add(7,'statistics','relative_frequency',()=>{const a=ri(2,8),b=ri(2,8);return f(`A spinner lands red ${a} times in ${a+b} trials. Observed red frequency?`,a,a+b,'Empirical relative frequency is red outcomes divided by total trials.');});
    add(7,'algebra','percent_increase',()=>{const start=ri(4,24)*10,pct=pick([10,20,25,50]);return n(`A value of ${start} increases by ${pct}%. What is the new value?`,start*(100+pct)/100,'Multiply by 1 plus the percentage as a decimal.',{min:0,step:5});});
    add(7,'geometry','scale_drawing',()=>{const scale=ri(2,8),measured=ri(2,20);return n(`A map scale is 1 cm : ${scale} km. What distance does ${measured} cm represent (km)?`,scale*measured,'Multiply the map length by distance per cm.',{min:0});});
    add(7,'algebra','slope_two_points',()=>{const m=ri(-5,5),b=ri(-10,10),x1=ri(-5,0),x2=ri(1,8);return n(`Find the slope through (${x1}, ${m*x1+b}) and (${x2}, ${m*x2+b}).`,m,'Slope = change in y divided by change in x.');});
    add(7,'arithmetic','negative_expression',()=>{const a=ri(-15,15),b=ri(-15,15),d=ri(-15,15);return n(`Calculate ${a} − (${b}) + (${d}).`,a-b+d,'Subtracting a negative changes its sign.');});

    // Grade 8: coordinate geometry, functions, exponents and inference.
    add(8,'algebra','linear_equation',()=>{const a=ri(2,10),x=ri(-12,12),b=ri(-20,20);return n(`Solve ${a}x − (${b}) = ${a*x-b}.`,x,'Move the constant to the other side and divide by the coefficient.');});
    add(8,'geometry','pythagorean',()=>{const [a,b,d]=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,12,15]]);return n(`A right triangle has legs ${a} and ${b}. Find the hypotenuse.`,d,'a² + b² = c² for right triangles.',{min:0});});
    add(8,'algebra','power_rules',()=>{const a=ri(2,9),m=ri(1,4),k=ri(1,3);return n(`Simplify ${a}^${m} × ${a}^${k} as ${a} raised to what power?`,m+k,'Multiply same-base powers by adding their exponents.',{min:0});});
    add(8,'algebra','function_evaluation',()=>{const m=ri(-8,8),b=ri(-20,20),x=ri(-5,8);return n(`For f(x) = ${m}x + (${b}), evaluate f(${x}).`,m*x+b,'Substitute the input x into the function.');});
    add(8,'statistics','mean_comparison',()=>{const a=ri(10,30),k=ri(2,12);return n(`A class mean is ${a}. Every score increases by ${k}. What is the new mean?`,a+k,'Adding a constant to all observations raises the mean by that constant.');});
    add(8,'geometry','distance_horizontal',()=>{const a=ri(-20,-1),b=ri(1,20);return n(`Distance between (${a}, 3) and (${b}, 3) on the coordinate plane?`,b-a,'With equal y coordinates, subtract x values.',{min:0});});
    add(8,'algebra','simultaneous_equations',()=>{const x=ri(-8,8),y=ri(-8,8);return n(`Solve for x: x + y = ${x+y} and x − y = ${x-y}.`,x,'Add the two equations to eliminate y, then divide by two.');});

    // Grade 9: high-school algebra, advanced reading of quantitative information.
    add(9,'algebra','quadratic_factor_roots',()=>{const a=ri(-9,-1),b=ri(1,9);return n(`Find the sum of roots of (x − (${a}))(x − ${b}) = 0.`,a+b,'Factored form reveals roots; add the two numbers.');});
    add(9,'algebra','polynomial_expand',()=>{const a=ri(-9,9),b=ri(-9,9);return n(`What is the coefficient of x in (x + (${a}))(x + (${b}))?`,a+b,'The x coefficient comes from the two cross terms.');});
    add(9,'algebra','linear_inequality',()=>{const a=ri(2,10),b=ri(-15,15),x=ri(-8,8);return n(`Solve ${a}x + (${b}) = ${a*x+b} for x.`,x,'Subtract the constant and divide by coefficient.');});
    add(9,'geometry','coordinate_midpoint',()=>{const a=ri(-15,15),b=ri(-15,15),c1=ri(-15,15),d=ri(-15,15);return n(`What is the x-coordinate of the midpoint between (${a},${c1}) and (${b},${d})?`,(a+b)/2,'Average the two x-coordinates.',{step:0.5});});
    add(9,'statistics','standardize_z_score',()=>{const mean=ri(40,100),sd=ri(2,20),z=pick([-2,-1,1,2,3]);return n(`A distribution has mean ${mean} and standard deviation ${sd}. Find z for value ${mean+sd*z}.`,z,'z = (value − mean) / standard deviation.');});
    add(9,'physics','speed_distance',()=>{const speed=ri(3,25),time=ri(3,20);return n(`At constant ${speed} m/s for ${time} seconds, distance in meters?`,speed*time,'Distance = speed times time.',{min:0});});
    add(9,'chemistry','atoms_in_compounds',()=>{const count=ri(2,9);return n(`How many hydrogen atoms are in ${count} H₂O molecules?`,count*2,'Each water molecule contains two hydrogen atoms.',{min:0});});
    add(9,'statistics','weighted_average',()=>{const a=ri(50,100),b=ri(50,100);return n(`A course grade is 50% test (${a}) and 50% project (${b}). What is the weighted score?`,(a+b)/2,'Multiply each score by its weight then sum.',{step:0.5,min:0});});

    // Grade 10: deeper mathematics and applied science.
    add(10,'algebra','quadratic_vertex',()=>{const a=ri(1,6),h=ri(-8,8),k=ri(-15,15);return n(`For f(x) = ${a}(x − (${h}))² + (${k}), what is the x-coordinate of its vertex?`,h,'Vertex form a(x − h)² + k places vertex at (h,k).');});
    add(10,'algebra','quadratic_discriminant',()=>{const a=ri(1,5),b=ri(-12,12),d=ri(-15,15);return n(`Calculate the discriminant of ${a}x² + (${b})x + (${d}) = 0.`,b*b-4*a*d,'Discriminant = b² − 4ac.');});
    add(10,'trigonometry','sine_special_angles',()=>{const [degree,value]=pick([[0,'0'],[30,'1/2'],[90,'1'],[150,'1/2'],[180,'0']]);return c(`What is sin(${degree}°)?`,value,['-1','-1/2','√3/2','1','0','1/2'].filter(x=>x!==value).slice(0,3),'Use the unit circle and the sine (vertical coordinate).');});
    add(10,'geometry','circle_area_coefficient',()=>{const r=ri(3,25);return n(`A circle has radius ${r}. Write its area as kπ. What is k?`,r*r,'Circle area is πr².',{min:0});});
    add(10,'statistics','binomial_probability',()=>{const heads=pick([1,2,3]);return c(`A fair coin is tossed twice. What is the probability of exactly ${heads} heads?`,heads===1?'1/2':heads===2?'1/4':'0',['0','1/4','1/2','3/4','1'].filter(x=>x!==(heads===1?'1/2':heads===2?'1/4':'0')).slice(0,3),'The four equally likely outcomes are HH, HT, TH and TT.');});
    add(10,'physics','work_energy',()=>{const f=ri(2,40),d=ri(2,20);return n(`A constant ${f} N force moves an object ${d} m in its direction. Work in joules?`,f*d,'Work = force × displacement when aligned.',{min:0});});
    add(10,'chemistry','molar_mass_water',()=>{const mol=ri(1,9);return n(`Using H₂O molar mass ≈18 g/mol, how many grams are in ${mol} mol water?`,mol*18,'Mass = amount in moles × molar mass.',{min:0});});
    add(10,'statistics','conditional_percentage',()=>{const a=ri(2,10),b=ri(2,10);return f(`Among ${a+b} enrolled students, ${a} chose chemistry. What fraction of enrolled students chose chemistry?`,a,a+b,'Use the specified group as denominator.');});

    // Grade 11: precalculus, calculus fundamentals and formal quantitative reasoning.
    add(11,'algebra','log_power',()=>{const base=ri(2,7),exp=ri(2,5);return n(`Find log base ${base} of ${base**exp}.`,exp,'A logarithm gives the exponent required to produce the value.');});
    add(11,'trigonometry','radians',()=>{const [degrees,numerator]=pick([[30,1],[60,2],[90,3],[120,4],[150,5]]);return c(`${degrees}° equals what multiple of π/6 radians?`,String(numerator),[String(numerator+1),String(numerator+2),String(numerator+3)],'Multiply degrees by π/180 and express in sixths.');});
    add(11,'calculus','differentiate_polynomial',()=>{const a=ri(1,12),b=ri(-12,12),x=ri(-6,6);return n(`For f(x) = ${a}x² + (${b})x + 7, find f′(${x}).`,2*a*x+b,'The derivative is 2ax + b; substitute the input.');});
    add(11,'algebra','exponential_equation',()=>{const base=ri(2,7),exp=ri(2,5);return n(`Solve ${base}^x = ${base**exp}.`,exp,'Equal positive bases imply equal exponents.');});
    add(11,'statistics','expected_value_fair_die',()=>{const sides=pick([4,6,8,10]);return n(`A fair ${sides}-sided die is labeled 1 to ${sides}. Its expected value?`,(sides+1)/2,'For equally likely endpoints 1 and n, mean = (1+n)/2.',{step:0.5,min:0});});
    add(11,'physics','kinematics',()=>{const v=ri(1,12),a=ri(1,8),t=ri(1,9);return n(`Initial speed ${v} m/s, constant acceleration ${a} m/s² for ${t} s. Final speed?`,v+a*t,'v_final = v_initial + acceleration × time.',{min:0});});
    add(11,'chemistry','dilution',()=>{const c1=ri(2,8),v1=ri(2,9),v2=v1*ri(2,5);return n(`Dilute ${v1} L of ${c1} mol/L solution to ${v2} L. Concentration in mol/L?`,c1*v1/v2,'Use C₁V₁ = C₂V₂ (no solute lost).',{min:0,step:0.5});});
    add(11,'algebra','arithmetic_sequence',()=>{const a=ri(-10,10),d=ri(2,9),nterm=ri(5,20);return n(`An arithmetic sequence starts at ${a} with common difference ${d}. Find term ${nterm}.`,a+(nterm-1)*d,'The nth term is first + (n−1) × common difference.');});

    // Grade 12: calculus, modeling, probability, linear algebra and science.
    add(12,'calculus','differentiate_cubic',()=>{const a=ri(1,5),b=ri(-5,5),x=ri(-5,5);return n(`f(x) = ${a}x³ + (${b})x² + 4. Find f′(${x}).`,3*a*x*x+2*b*x,'Apply power rule: 3ax² + 2bx.');});
    add(12,'calculus','definite_integral_linear',()=>{const a=ri(1,10),b=ri(-5,12),upper=ri(2,10);return n(`Evaluate ∫ from 0 to ${upper} of (${a}x + ${b}) dx.`,a*upper*upper/2+b*upper,'Antiderivative is (a/2)x² + bx; evaluate at endpoints.',{step:0.5});});
    add(12,'calculus','derivative_exponential',()=>{const base=pick([2,3,4,5]),x=ri(0,4);return c(`For f(x) = ${base}^x, which is f′(${x})?`,`${base**x} ln(${base})`,[`${base**x}`,`${base**x} ln(${base+1})`,`${base**x} + ${base}`],'Derivative of a^x is a^x ln(a).');});
    add(12,'algebra','matrix_determinant',()=>{const a=ri(-8,8),b=ri(-8,8),d=ri(-8,8),e=ri(-8,8);return n(`Determinant of 2×2 matrix with rows [${a}, ${b}] and [${d}, ${e}]?`,a*e-b*d,'For a 2×2 matrix, determinant = ad − bc.');});
    add(12,'statistics','binomial_expectation',()=>{const ntrials=ri(5,40),p=pick([0.2,0.25,0.4,0.5,0.75]);return n(`For a binomial random variable with n=${ntrials} and p=${p}, find E[X].`,ntrials*p,'Binomial expected successes = n × probability of success.',{step:0.25,min:0});});
    add(12,'statistics','conditional_independence',()=>{const p=pick([0.2,0.3,0.4,0.5]),q=pick([0.2,0.3,0.4,0.5]);return n(`Independent events A and B have probabilities ${p} and ${q}. Find P(A and B).`,p*q,'Multiply independent probabilities.',{step:0.01,min:0,decimals:4});});
    add(12,'physics','ohms_law',()=>{const current=ri(1,12),resistance=ri(2,30);return n(`A resistor carries ${current} A with resistance ${resistance} Ω. Voltage in volts?`,current*resistance,'Ohm’s law states voltage equals current times resistance: V = I × R.',{min:0});});
    add(12,'physics','kinetic_energy',()=>{const m=ri(1,14),v=ri(2,16);return n(`A ${m} kg object moves at ${v} m/s. Its kinetic energy in joules?`,0.5*m*v*v,'Kinetic energy = 1/2 mv².',{min:0,step:0.5});});
    add(12,'chemistry','ph_concentration',()=>{const ph=ri(2,6);return c(`Assuming ideal dilute conditions, hydrogen ion activity at pH ${ph} is approximately:`,`10^−${ph}`,[`10^${ph}`,`10^−${ph+1}`,`10^−${ph+2}`],'pH is the negative base-10 logarithm of hydrogen-ion activity.');});
    add(12,'algebra','geometric_sequence',()=>{const a=ri(2,8),r=ri(2,4),nth=ri(3,8);return n(`A geometric sequence starts at ${a}, ratio ${r}. Find term ${nth}.`,a*r**(nth-1),'nth term = first × ratio^(n−1).',{min:0,step:10});});
    add(12,'statistics','risk_difference',()=>{const a=ri(10,60),b=ri(1,a-1);return n(`A treatment has adverse event risk ${b}%, control risk ${a}%. Absolute risk reduction in percentage points?`,a-b,'Absolute risk reduction is control risk minus treatment risk.',{min:0});});

    const types = new Set(); for(const it of items){if(types.has(it.type))throw Error('Duplicate procedural id '+it.type);types.add(it.type);}
    return Object.freeze({ items:Object.freeze(items), count:items.length, gradeCounts:Array.from({length:13},(_,g)=>items.filter(x=>x.gradeMin===g).length) });
})();
window.CollegeProcedural = CollegeProcedural;
