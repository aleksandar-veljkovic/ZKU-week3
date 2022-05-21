pragma circom 2.0.0;

// [assignment] implement a variation of mastermind from https://en.wikipedia.org/wiki/Mastermind_(board_game)#Variation as a circuit
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/mux1.circom";

/*
 * Minimum of two input values
 */
template Min(m) {
    signal input in[2];
    signal output out;

    component ltComparator = LessThan(m);
    ltComparator.in[0] <== in[0];
    ltComparator.in[1] <== in[1];

    component mux = MultiMux1(1);
    mux.c[0][0] <== in[1];
    mux.c[0][1] <== in[0];

    mux.s <== ltComparator.out;

    out <== mux.out[0];
}

/*
 * Custom intersection size calculator
 * n - array size
 * m - max array element value
 */
template IntersectionSize(n, m) {
    signal input a[n];
    signal input b[n];
    signal output out;

    var aSpectrum[m];
    var bSpectrum[m];

    component aComparators[n * m];
    component bComparators[n * m];

    for (var i = 0; i < m; i++) {
        aSpectrum[i] = 0;
        bSpectrum[i] = 0;
        for (var j = 0; j < n; j++) {
            aComparators[n * i + j] = IsEqual();
            bComparators[n * i + j] = IsEqual();

            aComparators[n * i + j].in[0] <== i;
            aComparators[n * i + j].in[1] <== a[j] - 1;

            bComparators[n * i + j].in[0] <== i;
            bComparators[n * i + j].in[1] <== b[j] - 1;

            aSpectrum[i] += aComparators[n * i + j].out;
            bSpectrum[i] += bComparators[n * i + j].out;
        }
    }

    var interSize = 0;
    component minValues[m];

    for (var i = 0; i < m; i++) {
        minValues[i] = Min(m); 
        minValues[i].in[0] <== aSpectrum[i];
        minValues[i].in[1] <== bSpectrum[i];

        interSize += minValues[i].out;
    }

    out <== interSize;
}

/*
 * Number Mastermind implementation
 * 6 digits
 * 4 holes
 * extra hint: sum of all digits in the solution
 * Duplicate digits are allowed
*/
template MastermindVariation() {
    // Public inputs
    signal input guess[4]; // i.e. [1, 2, 3, 4]
    signal input pubSolutionHash; // Expected solution hash
    signal input pubNumMatched; // Number of expected matched values
    signal input pubNumNotInPlace; // Number of expected misplaced values
    signal input pubSolutionSum; // Expected sum of all solution values

    // Private inputs
    signal input solution[4]; // Solution array, i.e [4, 3, 2, 1]
    signal input salt; // Solution hash salt

    // Public outputs
    signal output computedSolutionHash; // Solution hash computed from given private inputs
    signal output isValid; // Flag indicating that all validations pass
    
    var numMatched; // Number of guessed digits in correct positions
    var numNotInPlace; // Number of guessed but misplaced digits

    // Calculating solution hash
    component solutionPoseidon = Poseidon(5);
    solutionPoseidon.inputs[0] <== salt;
    solutionPoseidon.inputs[1] <== solution[0];
    solutionPoseidon.inputs[2] <== solution[1];
    solutionPoseidon.inputs[3] <== solution[2];
    solutionPoseidon.inputs[4] <== solution[3];

    computedSolutionHash <== solutionPoseidon.out;

    // Solution hash comparator
    component hashesEqual = IsEqual();
    hashesEqual.in[0] <== solutionPoseidon.out;
    hashesEqual.in[1] <== pubSolutionHash;

    // Check guessed and solution value ranges, allowed range is [1, 6] 
    // and calculate solution sum (duplicate digits are allowed!)

    // Guessed values comparators
    component guessValueLessThan[4];
    component guessValueGreaterThan[4];
    
    // Solution values comparators
    component solutionValueLessThan[4];
    component solutionValueGreaterThan[4];

    // Cumulative values checker
    component valuesValid = IsEqual();
    var comparatorAccumulator = 0;

    // Solution accumulator
    var solSum = 0;

    for (var i = 0; i < 4; i++) {
        // Checking guess values interval
        guessValueLessThan[i] = LessThan(4);
        guessValueLessThan[i].in[0] <== guess[i];
        guessValueLessThan[i].in[1] <== 7;

        guessValueGreaterThan[i] = GreaterThan(4);
        guessValueGreaterThan[i].in[0] <== guess[i];
        guessValueGreaterThan[i].in[1] <== 0;
        
        comparatorAccumulator += guessValueLessThan[i].out;
        comparatorAccumulator += guessValueGreaterThan[i].out;

        // Checking solution values interval
        solutionValueLessThan[i] = LessThan(4);
        solutionValueLessThan[i].in[0] <== solution[i];
        solutionValueLessThan[i].in[1] <== 7;

        solutionValueGreaterThan[i] = GreaterThan(4);
        solutionValueGreaterThan[i].in[0] <== solution[i];
        solutionValueGreaterThan[i].in[1] <== 0;

        comparatorAccumulator += solutionValueLessThan[i].out;
        comparatorAccumulator += solutionValueGreaterThan[i].out;

        solSum += solution[i];
    }

    valuesValid.in[0] <== comparatorAccumulator;
    valuesValid.in[1] <== 16;

    // Solution sum validation
    component solutionSumValid = IsEqual();
    solutionSumValid.in[0] <== solSum;
    solutionSumValid.in[1] <== pubSolutionSum;


    // Count in-place matches
    component inPlaceComparators[4];
    var inPlace = 0;

    for (var i = 0; i < 4; i++) {
        inPlaceComparators[i] = IsEqual();
        inPlaceComparators[i].in[0] <== guess[i];
        inPlaceComparators[i].in[1] <== solution[i];
        inPlace += inPlaceComparators[i].out;
    }

    // Matched number validator
    component inPlaceValid = IsEqual();
    inPlaceValid.in[0] <== pubNumMatched;
    inPlaceValid.in[1] <== inPlace;

    // Computing solution/guess intersection size
    // for calculating number of misplaced values
    component intersectionSize = IntersectionSize(4, 6);

    for (var i = 0; i < 4; i++) {
        intersectionSize.a[i] <== guess[i];
        intersectionSize.b[i] <== solution[i];
    }

    numNotInPlace = intersectionSize.out - inPlace;

    // Misplaced number validator
    component misplacedValid = IsEqual();
    misplacedValid.in[0] <== pubNumNotInPlace;
    misplacedValid.in[1] <== numNotInPlace;
    
    // Overall validation
    signal _v1, _v2, _v3;
    _v1 <== valuesValid.out * hashesEqual.out;
    _v2 <== solutionSumValid.out * inPlaceValid.out;
    _v3 <== _v1 * _v2;
    isValid <== _v3 * misplacedValid.out;
}

component main {public [guess, pubSolutionHash, pubNumMatched, pubNumNotInPlace, pubSolutionSum]} = MastermindVariation();