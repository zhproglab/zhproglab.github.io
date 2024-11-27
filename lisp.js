// LISP Tokenizer Class with Integer State Constants
const STATE_START = 0;
const STATE_SYMBOL = 1;
const STATE_NUMBER = 2;
const STATE_STRING = 3;

class Tokenizer {
    constructor(code) {
        this.code = code;
        this.tokens = [];
        this.state = STATE_START;
        this.currentToken = '';
        this.index = 0;
    }

    tokenize() {
        while (this.index < this.code.length) {
            const char = this.code[this.index];

            switch (this.state) {
                case STATE_START:
                    if (/\s/.test(char)) {
                        // Ignore whitespace
                    } else if (char === ';') {
                        // Skip the rest of the line for comments
                        while (this.index < this.code.length && this.code[this.index] !== '\n') {
                            this.index++;
                        }
                    } else if (char === '(' || char === ')') {
                        this.tokens.push(char);
                    } else if (/[\p{L}_]/u.test(char)) { // Match any Unicode letter or underscore
                        this.state = STATE_SYMBOL;
                        this.currentToken += char;
                    } else if (/\d/.test(char)) {
                        this.state = STATE_NUMBER;
                        this.currentToken += char;
                    } else if (char === '"') {
                        this.state = STATE_STRING;
                        this.currentToken += char; // Start the string with a quote
                    } else if (/[+\-*/%><=]/.test(char)) {
                        // Check for two-character operators
                        const nextChar = this.code[this.index + 1];
                        if ((char === '>' || char === '<' || char === '=') && nextChar === '=') {
                            this.tokens.push(char + nextChar);
                            this.index++; // Skip the next character
                        } else {
                            this.tokens.push(char);
                        }
                    }
                    break;

                case STATE_SYMBOL:
                    if (/[\p{L}\p{N}_]/u.test(char)) { // Match any Unicode letter, number, or underscore
                        this.currentToken += char;
                    } else {
                        this.tokens.push(this.currentToken);
                        this.currentToken = '';
                        this.state = STATE_START;
                        continue; // Re-evaluate this character
                    }
                    break;

                case STATE_NUMBER:
                    if (/\d/.test(char)) {
                        this.currentToken += char;
                    } else {
                        this.tokens.push(this.currentToken);
                        this.currentToken = '';
                        this.state = STATE_START;
                        continue; // Re-evaluate this character
                    }
                    break;

                case STATE_STRING:
                    this.currentToken += char;
                    if (char === '"') {
                        this.tokens.push(this.currentToken);
                        this.currentToken = '';
                        this.state = STATE_START;
                    }
                    break;
            }

            this.index++;
        }

        // Handle any remaining token
        if (this.currentToken) {
            this.tokens.push(this.currentToken);
        }

        return this.tokens;
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentIndex = 0;
    }

    parse() {
        const ast = [];
        while (this.currentIndex < this.tokens.length) {
            ast.push(this.parseExpression());
        }
        return ast;
    }

    parseExpression() {
        const token = this.tokens[this.currentIndex++];

        if (token === '(') {
            const list = [];
            while (this.tokens[this.currentIndex] !== ')') {
                list.push(this.parseExpression());
            }
            this.currentIndex++; // Skip the closing ')'
            return list;
        } else if (token === ')') {
            throw new Error("Unexpected ')'");
        } else {
            return this.atom(token);
        }
    }

    atom(token) {
        if (!isNaN(token)) {
            return Number(token);
        } else {
            return token;
        }
    }
}

class Environment {
    constructor(outer = null) {
        this.bindings = {};
        this.outer = outer;
    }

    define(name, value) {
        this.bindings[name] = value;
    }

    lookup(name) {
        if (name in this.bindings) {
            return this.bindings[name];
        } else if (this.outer !== null) {
            return this.outer.lookup(name);
        } else {
            throw new Error(`Undefined variable: ${name}`);
        }
    }
}

class Interpreter {
    constructor(ast) {
        this.ast = ast;
        this.globalEnv = this.createGlobalEnv();
    }

    createGlobalEnv() {
        const env = new Environment();
        env.define('+', (a, b) => a + b);
        env.define('-', (a, b) => a - b);
        env.define('*', (a, b) => a * b);
        env.define('/', (a, b) => a / b);
        env.define('%', (a, b) => a % b);
        env.define('>', (a, b) => a > b);
        env.define('<', (a, b) => a < b);
        env.define('<=', (a, b) => a <= b);
        env.define('>=', (a, b) => a >= b);
        env.define('==', (a, b) => a === b);

        // Wrapper for Math functions
        const mathFunctions = [
            'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor',
            'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan'
        ];

        mathFunctions.forEach(func => {
            env.define(func, Math[func].bind(Math));
        });

        // Define the print function
        env.define('print', (...args) => {
            return args.map(arg => JSON.stringify(arg, null, 2)).join(' ');
        });

        // Define list operations
        env.define('car', (list) => {
            if (!Array.isArray(list)) {
                throw new Error('car expects a list');
            }
            return list[0];
        });

        env.define('cdr', (list) => {
            if (!Array.isArray(list)) {
                throw new Error('cdr expects a list');
            }
            return list.slice(1);
        });

        return env;
    }

    interpret() {
        const results = [];
        for (const expression of this.ast) {
            const result = this.evaluate(expression, this.globalEnv);
            if (result !== null) { // Only add non-null results to output
                // remove the quotes from the string
                if (typeof result === 'string' && result.startsWith('"') && result.endsWith('"')) {
                    const clean_result = result.slice(1, -1);
                    results.push(clean_result);
                } else {
                results.push(result);
                }
            }
        }
        return results.join('\n');
    }

    evaluate(expression, env) {
        if (typeof expression === 'number') {
            return expression;
        } else if (typeof expression === 'string') {
            if (expression.startsWith('"') && expression.endsWith('"')) {
                // It's a string literal
                return expression.slice(1, -1); // Remove the quotes
            } else {
                // It's a symbol
                return env.lookup(expression);
            }
        } else if (Array.isArray(expression)) {
            const [first, ...rest] = expression;
            if (first === 'defun') {
                const [[name, ...params], body] = rest;
                const proc = (...args) => {
                    const localEnv = new Environment(env);
                    params.forEach((param, index) => {
                        localEnv.define(param, args[index]);
                    });
                    return this.evaluate(body, localEnv);
                };
                env.define(name, proc);
                return null; // No output for defun
            } else if (first === 'define') {
                const [name, valueExpr] = rest;
                const value = this.evaluate(valueExpr, env);
                env.define(name, value);
                return null; // No output for define
            } else if (first === 'lambda') {
                const [params, body] = rest;
                return (...args) => {
                    const localEnv = new Environment(env);
                    params.forEach((param, index) => {
                        localEnv.define(param, args[index]);
                    });
                    return this.evaluate(body, localEnv);
                };
            } else if (first === 'let') {
                const [bindings, body] = rest;
                const localEnv = new Environment(env);
                for (const [name, valueExpr] of bindings) {
                    const value = this.evaluate(valueExpr, localEnv);
                    localEnv.define(name, value);
                }
                return this.evaluate(body, localEnv);
            } else if (first === 'if') {
                const [test, consequent, alternate] = rest;
                const testResult = this.evaluate(test, env);
                if (testResult) {
                    return this.evaluate(consequent, env);
                } else {
                    return this.evaluate(alternate, env);
                }
            } else {
                const proc = this.evaluate(first, env);
                if (typeof proc !== 'function') {
                    throw new Error(`${first} is not a function`);
                }
                const args = rest.map(arg => this.evaluate(arg, env));
                return proc(...args);
            }
        }
    }
}

const keywordMap = {
    "定义": "define",
    "令": "let",
    "函数": "lambda",
    "定义函数": "defun",
    "首": "car",
    "尾": "cdr",
    "打印": "print",
    "加": "+",
    "减": "-",
    "乘": "*",
    "除": "/",
    "如果": "if",
    "绝对值": "abs",
    "反余弦": "acos",
    "反正弦": "asin",
    "反正切": "atan",
    "反正切2": "atan2",
    "向上取整": "ceil",
    "余弦": "cos",
    "指数": "exp",
    "向下取整": "floor",
    "对数": "log",
    "最大值": "max",
    "最小值": "min",
    "幂": "pow",
    "随机": "random",
    "四舍五入": "round",
    "正弦": "sin",
    "平方根": "sqrt",
    "正切": "tan"
};

function run_lisp(code) {
    const tokenizer = new Tokenizer(code);
    let tokens = tokenizer.tokenize();
    console.log(tokens);

    // Translate tokens using the keyword map
    tokens = tokens.map(token => keywordMap[token] || token);
    console.log(tokens);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    console.log(ast);
    const interpreter = new Interpreter(ast);
    return interpreter.interpret();
}

// Usage
const code = `
    (定义 平方 (函数 (x) (* x x))) ; 定义一个计算平方的函数
    (打印 (平方 3)) ; 打印 3 的平方

    (令 ((a 3) (b 4))
        (如果 (> a b)
            (平方 a) ; 如果 a 大于 b，则计算 a 的平方
            (平方 b))) ; 否则，计算 b 的平方

    (打印 "为人民服务!") ; 打印问候语
`;

const result = run_lisp(code);
console.log(result); // Output: "9 Hello, World!"