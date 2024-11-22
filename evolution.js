class EvolutionMachine {
    constructor() {
        this.lines = [];
        this.variables = {};
        this.DEBUG_PARAM_SORTING = false;

        this.cmds = {
            '加': this.doAdd.bind(this),
            '减': this.doSub.bind(this),
            '乘': this.doMul.bind(this),
            '除': this.doDiv.bind(this),
            '阶乘': this.doFactorial.bind(this),
            '幂': this.doPower.bind(this),
            '指数': this.doExponent.bind(this),
        }

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

    // Helper function to handle binary operations
    doBinaryOp(params, operation) {
        if (this.DEBUG_PARAM_SORTING) {
            this.output += `原始参数: ${JSON.stringify(params)}\n`;
        }
        
        const numbers = params.map(p => {
            const num = Number(p.value);
            if (!isNaN(num)) {
                return { 
                    value: num, 
                    isLeft: p.name.startsWith('被')
                };
            }
            return { 
                value: this.getVar(p.value), 
                isLeft: p.name.startsWith('被')
            };
        });

        numbers.sort((a, b) => {
            if (a.isLeft) return -1;
            if (b.isLeft) return 1;
            return 0;
        });
        
        if (this.DEBUG_PARAM_SORTING) {
            const debugNums = numbers.map(n => `${n.isLeft ? '被' : ''}:${n.value}`);
            this.output += `排序后: [${debugNums.join(', ')}]\n`;
        }
        
        const sortedNums = numbers.map(n => n.value);
        return operation(sortedNums);
    }

    doAdd(params) {
        return this.doBinaryOp(params, nums => nums.reduce((sum, num) => sum + num, 0));
    }

    doSub(params) {
        return this.doBinaryOp(params, nums => nums[0] - nums[1]);
    }

    doMul(params) {
        return this.doBinaryOp(params, nums => nums.reduce((product, num) => product * num, 1));
    }

    doDiv(params) {
        return this.doBinaryOp(params, nums => {
            if (nums[1] === 0) {
                throw new Error('除数不能为零');
            }
            return nums[0] / nums[1];
        });
    }

    doFactorial(params) {
        return this.doBinaryOp(params, nums => {
            const n = nums[0];
            if (n < 0) throw new Error('阶乘不能为负数');
            if (!Number.isInteger(n)) throw new Error('阶乘必须为整数');
            let result = 1;
            for (let i = 2; i <= n; i++) result *= i;
            return result;
        });
    }

    doPower(params) {
        return this.doBinaryOp(params, nums => {
            if (nums[0] === 0 && nums[1] < 0) throw new Error('零的负数次幂未定义');
            return Math.pow(nums[0], nums[1]);
        });
    }

    doExponent(params) {
        return this.doBinaryOp(params, nums => Math.exp(nums[0]));
    }

    doCmd(cmd, params, resultVar) {
        if (!this.cmds[cmd]) {
            this.doError(cmd);
        } else {
            const result = this.cmds[cmd](params);
            if (resultVar) {
                this.setVar(resultVar, result);
            }
        }
    }

    evolveLine(line) {
        // Remove comments starting with //, ;, or #
        line = line.replace(/\/\/.*|;.*|#.*/, '').trim();
        
        // Skip empty lines or lines that only contained comments
        if (!line) return;

        const cmdMatch = line.match(/作\s*([^为\s结]+)/);
        const resultMatch = line.match(/结果记作\s*([^\s]+)/);
        
        if (!cmdMatch) return;
        const cmd = cmdMatch[1];
        const resultVar = resultMatch ? resultMatch[1] : null;

        let params = [];
        const lineWithoutResult = line.replace(/结果记作\s*([^\s]+)/, '');
        
        if (lineWithoutResult.includes('为')) {
            const paramPairs = lineWithoutResult.match(/以\s*([^为\s]+)\s*为\s*([^以作\s]+)/g);
            if (paramPairs) {
                params = paramPairs.map(pair => {
                    const [_, value, name] = pair.match(/以\s*([^为\s]+)\s*为\s*([^以作\s]+)/);
                    return {name: name.trim(), value: value.trim()};
                });
            }
        } else {
            const singleParam = lineWithoutResult.match(/以\s*([^作\s]+)/);
            if (singleParam) {
                params = [{name: '参数', value: singleParam[1].trim()}];
            }
        }

        if (this.verbose) {
            const paramsStr = params.map(p => `${p.name}:${p.value}`).join(', ');
            this.output += `参数列表: [${paramsStr}] 指令: ${cmd}${resultVar ? ` 结果记作: ${resultVar}` : ''}\n`;
        }

        this.doCmd(cmd, params, resultVar);
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
console.log(machine.evolve("以1为被加数 以2为加数 作加 结果记作总数", ""));
