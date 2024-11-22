const rules = [
    {
        'name': '加法',
        'function': 'doAdd',
        'mandatory_args': 2,
        'patterns': [
            '以 1 为被加数 以 2 为加数 作加法 结果记作 r',
            '1 加 2 => r',
            '1 + 2 => r',
        ]
    },
    {
        'name': '减法',
        'function': 'doSub',
        'mandatory_args': 2,
        'patterns': [
            '以 1 为被减数 以 2 为减数 作减法 结果记作 r',
            '1 减 2 => r',
            '1 - 2 => r',
        ]
    },
    {
        'name': '乘法',
        'function': 'doMul',
        'mandatory_args': 2,
        'patterns': [
            '以 1 为被乘数 以 2 为乘数 作乘法 结果记作 r',
            '1 乘 2 => r',
            '1 × 2 => r',
            '1 * 2 => r',
        ]
    },
    {
        'name': '除法',
        'function': 'doDiv',
        'mandatory_args': 2,
        'patterns': [
            '以 1 为被除数 以 2 为除数 作除法 结果记作 r',
            '1 除 2 => r',
            '1 ÷ 2 => r',
            '1 / 2 => r',
        ]
    },
    {
        'name': '阶乘',
        'function': 'doFactorial',
        'mandatory_args': 1,
        'patterns': [
            '以 1 为参数 作阶乘 结果记作 r',
            '1 的阶乘 => r',
            '1! => r',
        ]
    },
    {
        'name': '幂运算',
        'function': 'doPower',
        'mandatory_args': 2,
        'patterns': [
            '以 1 为底数 以 2 为指数 作幂运算 结果记作 r',
            '1 的 2 次幂 => r',
            '1 ^ 2 => r',
        ]
    },
    {
        'name': '指数函数',
        'function': 'doExponent',
        'mandatory_args': 1,
        'patterns': [
            '以 1 为参数 作指数 结果记作 r',
            'e的 1 次幂 => r',
            'exp 1 => r',
        ]
    }
]

function matchPattern(input, pattern) {
    // Trim and normalize input
    let remainingInput = input.trim();
    // Split pattern into parts
    const patternParts = pattern.split(' ');
    
    // Store matched values for numbers and result variable
    const args = [];
    let resultVar = null;
    
    for (const part of patternParts) {
        // Skip empty parts
        if (!part) continue;
        
        // Trim leading spaces from remaining input
        remainingInput = remainingInput.trimStart();
        
        // If no input left but still have pattern parts, matching failed
        if (!remainingInput) {
            console.log(`匹配失败: 没有剩余输入来匹配模式部分 "${part}"`);
            return null;
        }
        
        if (part.match(/^\d+$/)) { // Match any number placeholder
            // Match a number or a variable name (anything without spaces)
            const match = remainingInput.match(/^(\d+|\S+)(\s*)/);
            if (!match) {
                console.log(`匹配失败: 输入 "${remainingInput}" 不匹配数字或变量名`);
                return null;
            }
            
            // Store the matched value as an argument
            args.push(match[1]);
            // Remove matched text and trailing spaces from input
            remainingInput = remainingInput.slice(match[0].length);
        } else if (part === 'r') { // Match result variable
            // Match a variable name (anything without spaces)
            const match = remainingInput.match(/^(\S+)(\s*)/);
            if (!match) {
                console.log(`匹配失败: 输入 "${remainingInput}" 不匹配结果变量名`);
                return null;
            }
            
            // Store the matched value as the result variable
            resultVar = match[1];
            // Remove matched text and trailing spaces from input
            remainingInput = remainingInput.slice(match[0].length);
        } else {
            // For exact match parts, check if input starts with this part
            if (!remainingInput.startsWith(part)) {
                console.log(`匹配失败: 输入 "${remainingInput}" 不以 "${part}" 开头`);
                return null;
            }
            // Remove matched text from input
            remainingInput = remainingInput.slice(part.length);
        }
    }
    
    // If we have remaining input after matching all parts, matching failed
    if (remainingInput.trim()) {
        console.log(`匹配失败: 剩余未匹配输入 "${remainingInput}"`);
        return null;
    }
    
    return { args, resultVar };
}


class EvolutionMachine {
    constructor() {
        this.lines = [];
        this.variables = {};
    }

    setVar(name, value) {
        this.variables[name] = value;
        if (this.verbose) {
            this.output += `变量赋值: ${name} = ${value}\n`;
        }
    }

    getVar(name) {
        if (!(name in this.variables)) {
            throw new Error(`未定义的变量: ${name}`);
        }
        return this.variables[name];
    }

    // Helper function to handle unary operations
    doUnaryOp(params, operation) {
        if (params.length !== 1) {
            throw new Error('单参数操作需要且仅需要一个参数');
        }
        
        const param = params[0];
        const num = Number(param);
        const value = !isNaN(num) ? num : this.getVar(param);
        
        return operation(value);
    }

    // Helper function to handle binary operations
    doBinaryOp(params, operation) {
        if (params.length !== 2) {
            throw new Error('双参数操作需要且仅需要两个参数');
        }
        
        const values = params.map(param => {
            const num = Number(param);
            return !isNaN(num) ? num : this.getVar(param);
        });

        return operation(values);
    }

    doAdd(params) {
        return this.doBinaryOp(params, 
            nums => nums.reduce((sum, num) => sum + num, 0)
        );
    }

    doSub(params) {
        return this.doBinaryOp(params, 
            nums => nums[0] - nums[1]
        );
    }

    doMul(params) {
        return this.doBinaryOp(params, 
            nums => nums.reduce((product, num) => product * num, 1)
        );
    }

    doDiv(params) {
        return this.doBinaryOp(params, 
            nums => {
                if (nums[1] === 0) {
                    throw new Error('除数不能为零');
                }
                return nums[0] / nums[1];
            }
        );
    }

    doFactorial(params) {
        return this.doUnaryOp(params, 
            n => {
                if (n < 0) throw new Error('阶乘不能为负数');
                if (!Number.isInteger(n)) throw new Error('阶乘必须为整数');
                let result = 1;
                for (let i = 2; i <= n; i++) result *= i;
                return result;
            }
        );
    }

    doPower(params) {
        return this.doBinaryOp(params, 
            nums => {
                if (nums[0] === 0 && nums[1] < 0) throw new Error('零的负数次幂未定义');
                return Math.pow(nums[0], nums[1]);
            }
        );
    }

    doExponent(params) {
        return this.doUnaryOp(params, 
            n => Math.exp(n)
        );
    }

    doCmd(cmd, params, resultVar) {
        if (typeof this[cmd] !== 'function') {
            throw new Error(`未定义的命令: ${cmd}`);
        } else {
            const result = this[cmd](params);
            if (resultVar) {
                this.setVar(resultVar, result);
            }
        }
    }

    evolveLine(line) {
        // Remove comments starting with //, ;, or #
        line = line.replace(/\/\/.*|;.*|#.*/, '').trim();
        
        // Replace punctuation marks with spaces
        line = line.replace(/[.,。，;；]/g, ' ').trim();
        
        // Skip empty lines or lines that only contained comments
        if (!line) return;

        if (this.verbose) {
            this.output += `处理行: ${line}\n`;
        }

        for (const rule of rules) {
            if (this.verbose) {
                this.output += `尝试规则: ${rule.name}\n`;
            }
            for (const pattern of rule.patterns) {
                if (this.verbose) {
                    this.output += `尝试模式: ${pattern}\n`;
                }
                const matchResult = matchPattern(line, pattern);
                if (matchResult) {
                    const { args, resultVar } = matchResult;
                    
                    // Check if the number of arguments matches the rule's mandatory_args
                    if (args.length !== rule.mandatory_args) {
                        throw new Error(`参数数量不匹配: 需要 ${rule.mandatory_args} 个参数, 但找到 ${args.length} 个`);
                    }
                    
                    // Add debug message for matched pattern
                    if (this.verbose) {
                        this.output += `匹配成功: ${pattern}\n`;
                        this.output += `参数: ${JSON.stringify(args)}\n`;
                        this.output += `结果变量: ${resultVar}\n`;
                    }
                    
                    this.doCmd(rule.function, args, resultVar);
                    return; // Exit after the first successful match
                }
            }
        }

        throw new Error(`无法匹配的行: ${line}`);
    }

    evolve(input, verbose = false) {
        this.output = '';
        this.variables = {};
        this.verbose = verbose;  // Store verbose setting
        this.lines = input.split('\n');

        for (let line of this.lines) {
            this.evolveLine(line);
        }

        // Always show variable table, even in non-verbose mode
        if (Object.keys(this.variables).length > 0) {
            if (this.verbose) {
                this.output += '\n';  // Add spacing in verbose mode
            }
            this.output += '结果:\n';
            for (const [name, value] of Object.entries(this.variables)) {
                this.output += `${name}: ${value}\n`;
            }
        }

        return this.output;
    }
}

// Test the implementation
const machine = new EvolutionMachine();
console.log(machine.evolve("以1为被加数 以 2 为加数 作加法 结果记作总数", ""));

// Example Input
/*
以1为被加数 以2为加数 作加 结果记作总数甲
以1为被加数 以2为加数 作加法 结果记作总数乙
1 加 2 => 总数丙
1 + 2 => 总数丁
*/
