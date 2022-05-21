// [bonus] unit test for bonus.circom
const chai = require("chai");
const path = require("path");
const { buildPoseidon } = require('circomlibjs');

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const assert = chai.assert;

describe("Zombie Run test", function () {
    this.timeout(100000000);

    it("Shoud correctly create proof for the initial explorer's movement", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "bonus.circom"));
        await circuit.loadConstraints();

        // Create initial commitment
        /**
         * E . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . Z .  
         * . . . . . . . X 
         */

        const poseidon = await buildPoseidon();
        const startX = 0;
        const startY = 0;
        const salt = 12345;
        const zombiePosition = [6, 6];

        const initialCommitmentHash = poseidon.F.toString((poseidon([salt, startX, startY])));
        
        // Move to field (1, 1)
        /**
         * . . . . . . . .
         * . E . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . Z .  
         * . . . . . . . X 
         */
        // - Zombie can't smell the explorer
        // - Quadrant vector should be [0, 0, 0, 0]
        // - Explorer is not caught
        // - Explorer is out
        const explorerOldPosition = [0, 0];
        const explorerNewPosition = [0, 1];
        const quadrantVector = [0, 0, 0, 0];
        const newPubExplorerPositionHash = poseidon.F.toString((poseidon([salt, ...explorerNewPosition])));


        const INPUT = {
            // Private inputs
            salt: `${salt}`,
            explorerOldPosition: explorerOldPosition.map(value => `${value}`),
            explorerNewPosition: explorerNewPosition.map(value => `${value}`),

            // Public inputs
            pubExplorerPositionHash: initialCommitmentHash,
            pubExplorerCaught: "0",
            pubExplorerEscaped: "0",
            pubZombiePosition: zombiePosition.map(value => `${value}`),
            pubExplorerQuadrant: quadrantVector.map(value => `${value}`),
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(newPubExplorerPositionHash)), "New position hash should match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(1)), "Circuit validation signal should equal 1");
        assert(Fr.eq(Fr.e(witness[3]),Fr.e(initialCommitmentHash)), "Old position hash should the initial commitment hash");
        assert(Fr.eq(Fr.e(witness[4]),Fr.e(0)), "Explorer should not be caught");
        assert(Fr.eq(Fr.e(witness[5]),Fr.e(0)), "Explorer should not escape");
        assert(Fr.eq(Fr.e(witness[6]),Fr.e(6)), "Zombie's i-coordinate should be 6");
        assert(Fr.eq(Fr.e(witness[7]),Fr.e(6)), "Zombie's j-coordinate should be 6");
        assert(Fr.eq(Fr.e(witness[8]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[9]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[10]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[11]),Fr.e(0)), "Direction quadrant should be a zero vector");
    });

    it("Shoud correctly create proof for the explorer's position near the zombie", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "bonus.circom"));
        await circuit.loadConstraints();

        // Create initial commitment
        /**
         * E . . Z . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .  
         * . . . . . . . X 
         */

        const poseidon = await buildPoseidon();
        const startX = 0;
        const startY = 0;
        const salt = 12345;
        const zombiePosition = [0, 2];

        const initialCommitmentHash = poseidon.F.toString((poseidon([salt, startX, startY])));
        
        // Move to field (1, 0)
        /**
         * . . Z . . . . .
         * E . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .  
         * . . . . . . . X 
         */
        // - Zombie can smell the explorer
        // - Quadrant vector should be [0, 1, 1, 0]
        // - Explorer is not caught
        // - Explorer is out
        const explorerOldPosition = [0, 0];
        const explorerNewPosition = [1, 0];
        const quadrantVector = [0, 1, 1, 0]; // N S W E
        const newPubExplorerPositionHash = poseidon.F.toString((poseidon([salt, ...explorerNewPosition])));


        const INPUT = {
            // Private inputs
            salt: `${salt}`,
            explorerOldPosition: explorerOldPosition.map(value => `${value}`),
            explorerNewPosition: explorerNewPosition.map(value => `${value}`),

            // Public inputs
            pubExplorerPositionHash: initialCommitmentHash,
            pubExplorerCaught: "0",
            pubExplorerEscaped: "0",
            pubZombiePosition: zombiePosition.map(value => `${value}`),
            pubExplorerQuadrant: quadrantVector.map(value => `${value}`),
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(newPubExplorerPositionHash)), "New position hash should match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(1)), "Circuit validation signal should equal 1");
        assert(Fr.eq(Fr.e(witness[3]),Fr.e(initialCommitmentHash)), "Old position hash should the initial commitment hash");
        assert(Fr.eq(Fr.e(witness[4]),Fr.e(0)), "Explorer should not be caught");
        assert(Fr.eq(Fr.e(witness[5]),Fr.e(0)), "Explorer should not escape");
        assert(Fr.eq(Fr.e(witness[6]),Fr.e(0)), "Zombie's i-coordinate should be 0");
        assert(Fr.eq(Fr.e(witness[7]),Fr.e(2)), "Zombie's j-coordinate should be 2");
        assert(Fr.eq(Fr.e(witness[8]),Fr.e(0)), "North coordinate shoud be 0");
        assert(Fr.eq(Fr.e(witness[9]),Fr.e(1)), "South coordinate shoud be 1");
        assert(Fr.eq(Fr.e(witness[10]),Fr.e(1)), "West coordinate shoud be 1");
        assert(Fr.eq(Fr.e(witness[11]),Fr.e(0)), "East coordinate shoud be 0");
    });

    it("Shoud correctly create proof when the explorer gets caught", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "bonus.circom"));
        await circuit.loadConstraints();

        // Create initial commitment
        /**
         * E Z . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .  
         * . . . . . . . X 
         */

        const poseidon = await buildPoseidon();
        const startX = 0;
        const startY = 0;
        const salt = 12345;
        const zombiePosition = [0, 0];

        const initialCommitmentHash = poseidon.F.toString((poseidon([salt, startX, startY])));
        
        // Stays at (0, 0)
        /**
         * E/Z . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .  
         * . . . . . . . X 
         */
        // - Zombie can smell the explorer but on the same position
        // - Quadrant vector should be [0, 0, 0, 0]
        // - Explorer is caught
        // - Explorer is not out
        const explorerOldPosition = [0, 0];
        const explorerNewPosition = [0, 0];
        const quadrantVector = [0, 0, 0, 0]; // N S W E
        const newPubExplorerPositionHash = poseidon.F.toString((poseidon([salt, ...explorerNewPosition])));


        const INPUT = {
            // Private inputs
            salt: `${salt}`,
            explorerOldPosition: explorerOldPosition.map(value => `${value}`),
            explorerNewPosition: explorerNewPosition.map(value => `${value}`),

            // Public inputs
            pubExplorerPositionHash: initialCommitmentHash,
            pubExplorerCaught: "1",
            pubExplorerEscaped: "0",
            pubZombiePosition: zombiePosition.map(value => `${value}`),
            pubExplorerQuadrant: quadrantVector.map(value => `${value}`),
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(newPubExplorerPositionHash)), "New position hash should match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(1)), "Circuit validation signal should equal 1");
        assert(Fr.eq(Fr.e(witness[3]),Fr.e(initialCommitmentHash)), "Old position hash should the initial commitment hash");
        assert(Fr.eq(Fr.e(witness[4]),Fr.e(1)), "Explorer should be caught");
        assert(Fr.eq(Fr.e(witness[5]),Fr.e(0)), "Explorer should not escape");
        assert(Fr.eq(Fr.e(witness[6]),Fr.e(0)), "Zombie's i-coordinate should be 0");
        assert(Fr.eq(Fr.e(witness[7]),Fr.e(0)), "Zombie's j-coordinate should be 0");
        assert(Fr.eq(Fr.e(witness[8]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[9]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[10]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[11]),Fr.e(0)), "Direction quadrant should be a zero vector");
    });

    it("Shoud correctly create proof when the explorer escapes", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "bonus.circom"));
        await circuit.loadConstraints();

        // Create initial commitment
        /**
         * . Z . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .  
         * . . . . . . E X 
         */

        const poseidon = await buildPoseidon();
        const startX = 7;
        const startY = 6;
        const salt = 12345;
        const zombiePosition = [0, 1];

        const initialCommitmentHash = poseidon.F.toString((poseidon([salt, startX, startY])));
        
        // Move to field (1, 0)
        /**
         * . Z . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .  
         * . . . . . . . E/X 
         */
        // - Zombie can't smell the explorer
        // - Quadrant vector should be [0, 0, 0, 0]
        // - Explorer is not caught
        // - Explorer is out
        const explorerOldPosition = [7, 6];
        const explorerNewPosition = [7, 7];
        const quadrantVector = [0, 0, 0, 0]; // N S W E
        const newPubExplorerPositionHash = poseidon.F.toString((poseidon([salt, ...explorerNewPosition])));


        const INPUT = {
            // Private inputs
            salt: `${salt}`,
            explorerOldPosition: explorerOldPosition.map(value => `${value}`),
            explorerNewPosition: explorerNewPosition.map(value => `${value}`),

            // Public inputs
            pubExplorerPositionHash: initialCommitmentHash,
            pubExplorerCaught: "0",
            pubExplorerEscaped: "1",
            pubZombiePosition: zombiePosition.map(value => `${value}`),
            pubExplorerQuadrant: quadrantVector.map(value => `${value}`),
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(newPubExplorerPositionHash)), "New position hash should match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(1)), "Circuit validation signal should equal 1");
        assert(Fr.eq(Fr.e(witness[3]),Fr.e(initialCommitmentHash)), "Old position hash should the initial commitment hash");
        assert(Fr.eq(Fr.e(witness[4]),Fr.e(0)), "Explorer should not be caught");
        assert(Fr.eq(Fr.e(witness[5]),Fr.e(1)), "Explorer should escape");
        assert(Fr.eq(Fr.e(witness[6]),Fr.e(0)), "Zombie's i-coordinate should be 0");
        assert(Fr.eq(Fr.e(witness[7]),Fr.e(1)), "Zombie's j-coordinate should be 1");
        assert(Fr.eq(Fr.e(witness[8]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[9]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[10]),Fr.e(0)), "Direction quadrant should be a zero vector");
        assert(Fr.eq(Fr.e(witness[11]),Fr.e(0)), "Direction quadrant should be a zero vector");
    });

    it("Shoud fail to create valid proof when the explorer goes out of bounds", async () => {
        const circuit = await wasm_tester(path.join(__dirname, "../", "contracts", "circuits", "bonus.circom"));
        await circuit.loadConstraints();

        // Create initial commitment
        /**
         * . Z . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .  
         * . . . . . . E X 
         */

        const poseidon = await buildPoseidon();
        const startX = 7;
        const startY = 6;
        const salt = 12345;
        const zombiePosition = [0, 1];

        const initialCommitmentHash = poseidon.F.toString((poseidon([salt, startX, startY])));
        
        // Move to field (1, 0)
        /**
         * . Z . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .
         * . . . . . . . .
         * . . . . . . . . 
         * . . . . . . . .  
         * . . . . . . . E/X 
         */
        // - Zombie can't smell the explorer
        // - Quadrant vector should be [0, 0, 0, 0]
        // - Explorer is not caught
        // - Explorer is out
        const explorerOldPosition = [7, 6];
        const explorerNewPosition = [8, 6];
        const quadrantVector = [0, 0, 0, 0]; // N S W E
        const newPubExplorerPositionHash = poseidon.F.toString((poseidon([salt, ...explorerNewPosition])));


        const INPUT = {
            // Private inputs
            salt: `${salt}`,
            explorerOldPosition: explorerOldPosition.map(value => `${value}`),
            explorerNewPosition: explorerNewPosition.map(value => `${value}`),

            // Public inputs
            pubExplorerPositionHash: initialCommitmentHash,
            pubExplorerCaught: "0",
            pubExplorerEscaped: "1",
            pubZombiePosition: zombiePosition.map(value => `${value}`),
            pubExplorerQuadrant: quadrantVector.map(value => `${value}`),
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(newPubExplorerPositionHash)), "New position hash should match the given one");
        assert(Fr.eq(Fr.e(witness[2]),Fr.e(0)), "Circuit validation signal should equal 0");
    });
});