// [bonus] implement an example game from part d
pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/mux1.circom";

/*
 * The template computes absolute difference 
 * between two values, a and b; abs(a - b)
 */
template AbsDiff() {
    signal input a;
    signal input b;
    signal output out;

    component isAlessThanB = LessEqThan(5);
    isAlessThanB.in[0] <== a;
    isAlessThanB.in[1] <== b;

    component diff = MultiMux1(1);
    diff.c[0][0] <== a - b;
    diff.c[0][1] <== b - a;
    diff.s <== isAlessThanB.out;

    out <== diff.out[0];
}

/*
 * The template check if arrays A and B of length n are equal
 */
template isArrayEqual(n) {
    signal input a[n];
    signal input b[n];
    signal output out;

    var acc = 0;
    component elementsEqual[n];

    for (var i = 0; i < n; i++) {
        elementsEqual[i] = IsEqual();
        elementsEqual[i].in[0] <== a[i];
        elementsEqual[i].in[1] <== b[i];

        acc += elementsEqual[i].out;
    }

    component arraysEqual = IsEqual();
    arraysEqual.in[0] <== acc;
    arraysEqual.in[1] <== n;

    out <== arraysEqual.out;
}

/*
 * The template computes Manhattan distance 
 * between two 2D points, A and B
 */
template Distance() {
    signal input a[2];
    signal input b[2];
    signal output out;

    component dx = AbsDiff();
    dx.a <== a[0];
    dx.b <== b[0];

    component dy = AbsDiff();
    dy.a <== a[1];
    dy.b <== b[1];

    out <== dx.out + dy.out;
}

/*
 * The template implements explorer's move validation
 * for the proposed "Zombie run" game.
 * -- Separate circuit should be used for validating the initial explorer's commitment
 *    at position (0,0)!
 */
template ZombieRun() {
    // inputs
    signal input salt;  // Salt value used for preventing the brute force attack
    signal input explorerOldPosition[2]; // Current position of the explorer (i, j)
    signal input explorerNewPosition[2]; // Explorer's new position (iNew, jNew)

    // Public inputs 
    signal input pubExplorerPositionHash; // Current explorer's position hash
    signal input pubExplorerCaught; // Flag which indicates if the explorer is caught by the zombie
    signal input pubExplorerEscaped; // Flag which indicates if the explorer escaped
    signal input pubZombiePosition[2]; // Position of the zombie (i, j)
    signal input pubExplorerQuadrant[4]; // Quadrant unit vector (N, S, W, E) where the explorer is relative to the zombie,
                                        // value (0, 0, 0, 0) is reserved for no smell indication.
                                        // Example: (1, 0, 1, 0) => explorer is north-west of the zombie
    
    // Public outputs
    signal output newPubExplorerPositionHash; // New explorer's position hash
    signal output isValid; // Flag indicating if all requirements regarding the movement 
                                  // and the position hash are fulfilled

    // Checking the validity of the explorer's position (i, j) hash
    // valid (pubExplorerPositionHash) <=> Poseidon(i, j) == pubExplorerPositionHash
    // =============================================================================

    component isHashValid = IsEqual();

    // Compute hash
    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== salt;
    poseidon.inputs[1] <== explorerOldPosition[0];
    poseidon.inputs[2] <== explorerOldPosition[1];
    
    // Compare the computed and provided position hash
    isHashValid.in[0] <== poseidon.out;
    isHashValid.in[1] <== pubExplorerPositionHash;

    // Checking the validity of the explorer's movement vector
    // valid (newI, newJ) <=> newI >= 0 and newI <= 7 and newJ >= 0 and newJ <= 7
    // and distance((i, j), (newI, newJ)) == 1
    // =======================================================

    signal iNew <== explorerNewPosition[0];
    signal jNew <== explorerNewPosition[1];

    signal isNewPositionValid;

    component posInboundTop = GreaterEqThan(5);
    component posInboundLeft = GreaterEqThan(5);
    component posInboundBottom = LessEqThan(5);
    component posInboundRight = LessEqThan(5);

    // iNew >= 0
    posInboundTop.in[0] <== iNew;
    posInboundTop.in[1] <== 0;

    // jNew >= 0
    posInboundLeft.in[0] <== jNew;
    posInboundLeft.in[1] <== 0;

    // iNew <= 7
    posInboundBottom.in[0] <== iNew;
    posInboundBottom.in[1] <== 7;

    // jNew <= 7
    posInboundRight.in[0] <== jNew;
    posInboundRight.in[1] <== 7;

    // Checking bounds
    signal lowerBoundsValid <== posInboundTop.out * posInboundLeft.out;
    signal upperBoundsValid <== posInboundBottom.out * posInboundRight.out;

    signal boundsValid <== lowerBoundsValid * upperBoundsValid;
    

    // Computing new position hash
    // hash(salt, iNew, jNew)
    // =============================================================================

    component newHash = Poseidon(3);
    newHash.inputs[0] <== salt;
    newHash.inputs[1] <== iNew;
    newHash.inputs[2] <== jNew;

    newPubExplorerPositionHash <== newHash.out;

    // Checking if the explorer has escaped
    // escaped <=> iNew == 7 and jNew == 7
    // ================================================================
    signal isExplorerOut;
    component iNewOut = IsEqual();
    component jNewOut = IsEqual();
    
    // iNew == 7
    iNewOut.in[0] <== iNew;
    iNewOut.in[1] <== 7;

    // jNew == 7
    jNewOut.in[0] <== jNew;
    jNewOut.in[1] <== 7;

    isExplorerOut <== iNewOut.out * jNewOut.out;

    component isExplorerOutMatched = IsEqual();
    isExplorerOutMatched.in[0] <== isExplorerOut;
    isExplorerOutMatched.in[1] <== pubExplorerEscaped;

    // Checking if the explorer is caught
    // caught <=> explorerOldPosition.i == zombie.i and explorerOldPosition.j == zombie.j and not isExplorerOut
    // ================================================================

    signal isPositionMatched;
    signal isExplorerCaught;
    component iMatched = IsEqual();
    component jMatched = IsEqual();

    iMatched.in[0] <== explorerOldPosition[0];
    iMatched.in[1] <== pubZombiePosition[0];

    jMatched.in[0] <== explorerOldPosition[1];
    jMatched.in[1] <== pubZombiePosition[1];

    isPositionMatched <== iMatched.out * jMatched.out;
    
    signal explorerNotOut <== 1 - isExplorerOut;
    isExplorerCaught <== isPositionMatched * explorerNotOut;

    component isExplorerCaughtMatched = IsEqual();
    isExplorerCaughtMatched.in[0] <== isExplorerCaught;
    isExplorerCaughtMatched.in[1] <== pubExplorerCaught;

    component isNewPositionDistanceValid = IsEqual();

    // Check if new position is one field away from the previous position,
    // if the explorer hasn't been caught, or 0 otherwise.

    component newPositionDistance = Distance();
    
    newPositionDistance.a[0] <== explorerOldPosition[0];
    newPositionDistance.a[1] <== explorerOldPosition[1];

    newPositionDistance.b[0] <== explorerNewPosition[0];
    newPositionDistance.b[1] <== explorerNewPosition[1];

    isNewPositionDistanceValid.in[0] <== newPositionDistance.out;
    isNewPositionDistanceValid.in[1] <== 1 - isExplorerCaught;
    
    isNewPositionValid <== boundsValid * isNewPositionDistanceValid.out;

    // Checking if the zombie can smell the explorer
    // zombieCanSmell <=> distance(explorerOldPosition, pubZombiePosition) <= 3
    // =====================================================================

    component zombieCanSmell = LessEqThan(5);

    component distance = Distance();
    distance.a[0] <== explorerOldPosition[0];
    distance.a[1] <== explorerOldPosition[1];

    distance.b[0] <== pubZombiePosition[0];
    distance.b[1] <== pubZombiePosition[1];

    zombieCanSmell.in[0] <== distance.out;
    zombieCanSmell.in[1] <== 3;

    // Computing smell direction vector
    // ================================

    signal quadrantVector[4];
    component isDiNegative = LessThan(5);
    component isDiPositive = GreaterThan(5);
    component isDjNegative = LessThan(5);
    component isDjPositive = GreaterThan(5);

    isDiNegative.in[0] <== iNew;
    isDiNegative.in[1] <== pubZombiePosition[0];

    isDiPositive.in[0] <== iNew;
    isDiPositive.in[1] <== pubZombiePosition[0];

    isDjNegative.in[0] <== jNew;
    isDjNegative.in[1] <== pubZombiePosition[1];

    isDjPositive.in[0] <== jNew;
    isDjPositive.in[1] <== pubZombiePosition[1];

    quadrantVector[0] <== isDiNegative.out;
    quadrantVector[1] <== isDiPositive.out;
    quadrantVector[2] <== isDjNegative.out;
    quadrantVector[3] <== isDjPositive.out;

    component smellQuadrantVector = MultiMux1(4);
    smellQuadrantVector.c[0][0] <== 0;
    smellQuadrantVector.c[1][0] <== 0;
    smellQuadrantVector.c[2][0] <== 0;
    smellQuadrantVector.c[3][0] <== 0;

    smellQuadrantVector.c[0][1] <== quadrantVector[0];
    smellQuadrantVector.c[1][1] <== quadrantVector[1];
    smellQuadrantVector.c[2][1] <== quadrantVector[2];
    smellQuadrantVector.c[3][1] <== quadrantVector[3];
    smellQuadrantVector.s <== zombieCanSmell.out;

    // Checking if the computed quadrant vector matches the provided one
    // =================================================================

    component isQuadrantVectorValid = isArrayEqual(4);
    isQuadrantVectorValid.a[0] <== smellQuadrantVector.out[0];
    isQuadrantVectorValid.a[1] <== smellQuadrantVector.out[1];
    isQuadrantVectorValid.a[2] <== smellQuadrantVector.out[2];
    isQuadrantVectorValid.a[3] <== smellQuadrantVector.out[3];

    isQuadrantVectorValid.b[0] <== pubExplorerQuadrant[0];
    isQuadrantVectorValid.b[1] <== pubExplorerQuadrant[1];
    isQuadrantVectorValid.b[2] <== pubExplorerQuadrant[2];
    isQuadrantVectorValid.b[3] <== pubExplorerQuadrant[3];

    // Cumulative validation of all requirements
    // =====================================================================
    signal _v1 <== isHashValid.out * isNewPositionValid;
    signal _v2 <== isNewPositionValid * isExplorerOutMatched.out;
    signal _v3 <== isExplorerCaughtMatched.out * isQuadrantVectorValid.out;
    signal _v4 <== _v1 * _v2;
    isValid <== _v3 * _v4;
}

component main { public [
    pubExplorerPositionHash,
    pubExplorerCaught,
    pubExplorerEscaped,
    pubZombiePosition,
    pubExplorerQuadrant
] } = ZombieRun();