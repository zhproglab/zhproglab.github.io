class EvolutionMachine {
    constructor() {
        this.stack = [];
        this.builtinRules = {
            '加': (a, b) => a + b,
            '减': (a, b) => a - b,
            '乘': (a, b) => a * b,
            '除': (a, b) => a / b
        };
        this.customRules = [];
    }

    parseRules(input) {
        const lines = input.split('\n').map(line => line.trim()).filter(line => line);
        for (const line of lines) {
            if (line.includes('=>')) {
                const [pattern, transform] = line.split('=>').map(s => s.trim());
                this.addRule(pattern, transform);
            }
        }
    }

    addRule(pattern, transform) {
        // Convert pattern and transform to token arrays
        const patternTokens = pattern.split(' ');
        const transformTokens = transform.split(' ');
        this.customRules.push({ pattern: patternTokens, transform: transformTokens });
    }

    isVariable(token) {
        return /^[甲乙丙丁戊己庚辛壬癸]$/.test(token);
    }

    isValue(token) {
        return !isNaN(parseFloat(token)) || 
               (typeof token === 'string' && !this.isVariable(token));
    }

    matchPattern(pattern) {
        if (this.stack.length < pattern.length) return false;
        
        const variables = {};
        const stackSlice = this.stack.slice(-pattern.length);

        for (let i = 0; i < pattern.length; i++) {
            const patternToken = pattern[i];
            const stackToken = stackSlice[i];

            if (this.isVariable(patternToken)) {
                // Pattern token is a variable, can match any value or variable
                if (variables[patternToken]) {
                    // If we've seen this variable before, it must match
                    if (variables[patternToken] !== stackToken) {
                        return false;
                    }
                } else {
                    // First time seeing this variable, store the match
                    variables[patternToken] = stackToken;
                }
            } else if (patternToken !== stackToken) {
                // Non-variable tokens must match exactly
                return false;
            }
        }

        return variables;
    }

    applyTransform(transform, variables) {
        const result = [];
        for (const token of transform) {
            if (token in variables) {
                result.push(variables[token]);
            } else {
                result.push(token);
            }
        }
        return result;
    }

    processBuiltinRule() {
        // Need at least 3 tokens for pattern "甲 操作符 乙"
        if (this.stack.length < 3) return false;

        // Get the last 3 tokens
        const lastThree = this.stack.slice(-3);
        const [a, operator, b] = lastThree;

        // Check if middle token is an operator
        if (operator in this.builtinRules) {
            // Try to parse the numbers
            const numA = parseFloat(a);
            const numB = parseFloat(b);

            // Check if both tokens are valid numbers
            if (!isNaN(numA) && !isNaN(numB)) {
                // Remove the 3 tokens
                this.stack.splice(-3);
                
                // Calculate and push result
                const result = this.builtinRules[operator](numA, numB);
                this.stack.push(result.toString());
                return true;
            }
        }

        return false;
    }

    matchCustomRules() {
        for (const rule of this.customRules) {
            const variables = this.matchPattern(rule.pattern);
            if (variables) {
                // Remove matched tokens
                this.stack.splice(-rule.pattern.length);
                // Apply transform
                const transformed = this.applyTransform(rule.transform, variables);
                this.stack.push(...transformed);
                return true;
            }
        }
        return false;
    }

    evolveExpression(tokens) {
        this.stack = [];
        const steps = [tokens.join(' ')];
        
        // Process each token
        for (const token of tokens) {
            this.stack.push(token);
            
            // Keep trying to apply rules until no more matches
            let ruleApplied;
            do {
                ruleApplied = false;
                if (this.processBuiltinRule()) {
                    ruleApplied = true;
                    steps.push(this.stack.join(' '));
                } else if (this.matchCustomRules()) {
                    ruleApplied = true;
                    steps.push(this.stack.join(' '));
                }
            } while (ruleApplied);
        }
        
        return steps;
    }

    evolve(input) {
        // Process each line
        const lines = input.split('\n').map(line => line.trim()).filter(line => line);
        const results = [];

        for (const line of lines) {
            if (line.includes('=>')) {
                // Process as rule definition
                const [pattern, transform] = line.split('=>').map(s => s.trim());
                this.addRule(pattern, transform);
            } else {
                // Process as evolution input
                const tokens = line.split(' ');
                const steps = this.evolveExpression(tokens);
                
                // Format steps with arrows
                results.push(steps.join(' =>\n'));
            }
        }

        return results.join('\n');
    }
}

// Test the implementation
const machine = new EvolutionMachine();

// Test case 1: Addition rules
const test1 = `
把 甲 和 乙 相加 => 甲 加 乙
计算 甲 和 乙 的和 => 甲 加 乙

把 1 和 2 相加
`;

// console.log(machine.evolve(test1)); // 输出: 3

// Test case 2: Factorial rule
const test2 = `
阶乘 1 => 1
阶乘 甲 => 甲 乘 阶乘 甲 减 1

阶乘 4
`;

//console.log(machine.evolve(test2)); // 输出: 6

const test = `
计算 甲 和 乙 的和 => 甲 加 乙

计算 1 和 2 的和
`;

// console.log(machine.evolve(test));

// 输出:
// 1 加 2 => 计算 1 和 2 的和 => 1 加 2 => 3
// x 加 y => 计算 x 和 y 的和 => x 加 y
