const chai = require("chai");
const path = require("path");
const { buildPoseidon } = require('circomlibjs');

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const assert = chai.assert;

describe("Mastermind variation test", function () {
    this.timeout(100000000);

    it("Shoud correctly compute all matched values", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "MastermindVariation.circom"));
        await circuit.loadConstraints();
        
        const poseidon = await buildPoseidon();
        const solution = [1, 1, 1, 1];
        const guess    = [1, 1, 1, 1];
        const pubNumMatched = 4;
        const pubNumNotInPlace = 0;

        const salt = 12345;
        const solutionHash = poseidon.F.toString((poseidon([salt, ...solution])));
        const solutionSum = solution.reduce((prev, curr) => prev + curr, 0);   

        const INPUT = {
            guess: guess.map(value => `${value}`),
            solution: solution.map(value => `${value}`),
            salt: `${salt}`,
            pubSolutionHash: solutionHash,
            pubNumMatched: `${pubNumMatched}`,
            pubNumNotInPlace: `${pubNumNotInPlace}`,
            pubSolutionSum: `${solutionSum}`,
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solutionHash)), "Solution hash doesn't match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(1)), "Circuit validation signal should equal 1");
    });

    it("Shoud correctly compute all missed values", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "MastermindVariation.circom"));
        await circuit.loadConstraints();
        
        const poseidon = await buildPoseidon();
        const solution = [1, 1, 1, 1];
        const guess    = [2, 2, 2, 2];
        const pubNumMatched = 0;
        const pubNumNotInPlace = 0;

        const salt = 12345;
        const solutionHash = poseidon.F.toString((poseidon([salt, ...solution])));
        const solutionSum = solution.reduce((prev, curr) => prev + curr, 0);   

        const INPUT = {
            "guess": guess.map(value => `${value}`),
            "solution": solution.map(value => `${value}`),
            "salt": `${salt}`,
            "pubSolutionHash": solutionHash,
            "pubNumMatched": `${pubNumMatched}`,
            "pubNumNotInPlace": `${pubNumNotInPlace}`,
            "pubSolutionSum": `${solutionSum}`,
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solutionHash)), "Solution hash doesn't match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(1)), "Circuit validation signal should equal 1");
    });

    it("Shoud correctly compute the number of all misplaced values", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "MastermindVariation.circom"));
        await circuit.loadConstraints();
        
        const poseidon = await buildPoseidon();
        const solution = [1, 2, 3, 4];
        const guess    = [4, 3, 2, 1];
        const pubNumMatched = 0;
        const pubNumNotInPlace = 4;

        const salt = 12345;
        const solutionHash = poseidon.F.toString((poseidon([salt, ...solution])));
        const solutionSum = solution.reduce((prev, curr) => prev + curr, 0);   

        const INPUT = {
            "guess": guess.map(value => `${value}`),
            "solution": solution.map(value => `${value}`),
            "salt": `${salt}`,
            "pubSolutionHash": solutionHash,
            "pubNumMatched": `${pubNumMatched}`,
            "pubNumNotInPlace": `${pubNumNotInPlace}`,
            "pubSolutionSum": `${solutionSum}`,
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solutionHash)), "Solution hash doesn't match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(1)), "Circuit validation signal should equal 1");
    });

    it("Shoud correctly compute the number of matches/misplaced matches", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "MastermindVariation.circom"));
        await circuit.loadConstraints();
        
        const poseidon = await buildPoseidon();
        const solution = [2, 4, 4, 1];
        const guess    = [1, 4, 4, 4];
        const pubNumMatched = 2;
        const pubNumNotInPlace = 1;

        const salt = 12345;
        const solutionHash = poseidon.F.toString((poseidon([salt, ...solution])));
        const solutionSum = solution.reduce((prev, curr) => prev + curr, 0);   

        const INPUT = {
            "guess": guess.map(value => `${value}`),
            "solution": solution.map(value => `${value}`),
            "salt": `${salt}`,
            "pubSolutionHash": solutionHash,
            "pubNumMatched": `${pubNumMatched}`,
            "pubNumNotInPlace": `${pubNumNotInPlace}`,
            "pubSolutionSum": `${solutionSum}`,
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solutionHash)), "Solution hash doesn't match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(1)), "Circuit validation signal should equal 1");
    });

    it("Shoud fail for invalid solution hash", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "MastermindVariation.circom"));
        await circuit.loadConstraints();
        
        const poseidon = await buildPoseidon();
        const solution = [2, 4, 4, 1];
        const guess    = [1, 4, 4, 4];
        const pubNumMatched = 2;
        const pubNumNotInPlace = 1;

        const salt = 12345;
        const solutionHash = "1234567890";
        const solutionSum = solution.reduce((prev, curr) => prev + curr, 0);   

        const INPUT = {
            "guess": guess.map(value => `${value}`),
            "solution": solution.map(value => `${value}`),
            "salt": `${salt}`,
            "pubSolutionHash": solutionHash,
            "pubNumMatched": `${pubNumMatched}`,
            "pubNumNotInPlace": `${pubNumNotInPlace}`,
            "pubSolutionSum": `${solutionSum}`,
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.neq(Fr.e(witness[1]),Fr.e(solutionHash)), "Solution hash shouldn't match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(0)), "Circuit validation signal should equal 0");
    });

    it("Shoud fail for invalid number of matches", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "MastermindVariation.circom"));
        await circuit.loadConstraints();
        
        const poseidon = await buildPoseidon();
        const solution = [2, 4, 4, 1];
        const guess    = [1, 4, 4, 4];
        const pubNumMatched = 6;
        const pubNumNotInPlace = 1;

        const salt = 12345;
        const solutionHash = poseidon.F.toString((poseidon([salt, ...solution])));
        const solutionSum = solution.reduce((prev, curr) => prev + curr, 0);   

        const INPUT = {
            "guess": guess.map(value => `${value}`),
            "solution": solution.map(value => `${value}`),
            "salt": `${salt}`,
            "pubSolutionHash": solutionHash,
            "pubNumMatched": `${pubNumMatched}`,
            "pubNumNotInPlace": `${pubNumNotInPlace}`,
            "pubSolutionSum": `${solutionSum}`,
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solutionHash)), "Solution hash should match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(0)), "Circuit validation signal should equal 0");
    });
});