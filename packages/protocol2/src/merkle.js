const utils = require('@fuel-js/utils');

/// @notice Get the initial merkle depth of a tree by given leaf count.
/// @param leafCount The number of current leafs.
/// @return depth The depth of the merkle tree.
function computeMerkleTreeDepth(leafCount = 0) {
    let depth = 0;
    let numNodes = leafCount;

    // If num nodes is odd, add one.
    if (numNodes % 2 > 0) {
        numNodes++;
    }

    // While numNodes is greater than one.
    while (numNodes > 1) {
        // If num nodes is odd, add one.
        if (numNodes % 2 > 0) {
            numNodes++;
        }

        // Shift right by one.
        numNodes = numNodes >> 1;

        // Increase depth.
        depth++;
    }

    // Return depth.
    return depth;
}

/// @notice Get the number of leafs for a given balanced binary merkle tree.
/// @param leafCount The current number of leafs in the tree.
/// @return balanceCount The number of leafs after balancing.
function computeMerkleTreeWidth(leafCount = 0) {
    // Merkle tree depth is 2 ^ depths.
    return Math.pow(
        2,
        computeMerkleTreeDepth(leafCount),
    );
}

/// @notice Compute the inner node hash.
/// @param partA Hex string inner part A.
/// @param partB Hex string inner part B.
/// @return The innerNode hash.
function computeInnerNode(partA, partB) {
    return utils.keccak256(
        '0x01' + (partA.slice(2) + partB.slice(2)),
    );
}

/// @notice Compute transaction leaf.
/// @param leaf Struct | string.
/// @return transaction leaf hash.
function computeTransactionLeaf(leaf) {
    return utils.keccak256(
        '0x00' + ((leaf || {}).encodePacked
            ? leaf.encodePacked()
            : (leaf || '0x')).slice(2),
    );
}

/// @notice Compute empty leaf hash.
/// @return Returns the empty leaf hash.
function computeEmptyTransactionLeaf() {
    return utils.keccak256(
        '0x00',
    );
}

/// @notice Compute the balanced binary merkle tree root of given leafs.
/// @param leafs Non-empty tx leafs.
/// @return layers.
function computeMerkleTreeLayers(leafs = []) {
    // Compute the base hashes for the non-empty leafs.
    let hashes = leafs.map(computeTransactionLeaf);

    // Layers.
    let layers = [];

    // Swap array for hashing.
    let swap = [];

    // Ensure at least one leaf.
    utils.assert(leafs.length > 0, 'leafs length underflow');

    // Append zero base hashes to balance out the tree.
    hashes = hashes.concat(
        new Array(computeMerkleTreeWidth(leafs.length) - leafs.length)
            .fill(computeEmptyTransactionLeaf()),
    );

    // Go through each set of hashes at each depth.
    for (var i = 0; hashes.length > 0; i++) {
        // Add hashes for this depth.
        layers.push(hashes);

        // Go through hashes at this depth.
        for (var z = 0; z < hashes.length; z += 2) {
            // Compute inner node hashes.
            swap.push(computeInnerNode(hashes[z], hashes[z + 1]));
        }

        // Hashes is now swap, swap empty.
        hashes = swap;
        swap = [];

        // If hashes length is less than 2, stop the process, we are at the root.
        if (hashes.length < 2) {
            break;
        }
    }

    // Add the merkle root the layers.
    layers.push([ hashes[0] ]);

    // Return the merkle tree root.
    return layers;
}

/// @notice Compute the balanced binary merkle tree root of given leafs.
/// @param leafs Non-empty tx leafs.
/// @return merkleTreeRoot The merkle tree root hash.
function merkleTreeRoot(leafs = []) {
    // The last layer and single value is the merkle root.
    return computeMerkleTreeLayers(leafs).pop()[0];
}

/// @notice Compute rightmost index.
/// @param leafs Given the leafs.
/// @return rightmostIndex The rightmost index for this tree.
function rightmostIndex(leafs = []) {
    return computeMerkleTreeWidth(leafs.length) - 1;
}

/// @notice Build a merkle proof from the leafs.
/// @param leafs The leafs in the merkle tree.
/// @param transactionIndex The bitmap transaction index for the leaf for proofing.
/// @return merkleProof The array of opposite merkle proof hashes.
function merkleProof(leafs = [], transactionIndex = null) {
    // Compute the merkle leafs.
    let layers = computeMerkleTreeLayers(leafs);

    // Establish new pointer for transaction index.
    let _transactionIndex = transactionIndex;

    // Ensure transaction index is valid.
    utils.assert(
        typeof transactionIndex === 'number',
        'transactionIndex must be a number',
    );

    // Ensure the transaction index selects a valid base leaf.
    utils.assert(
        transactionIndex < layers[0].length,
        `transactionIndex overflow while proofing: ${
            transactionIndex
        } >= ${
            layers[0].length
        }`,
    );

    // The returned merkle proof for this leaf.
    let proof = [];

    // Find rightmost, start at top and work your way down.
    for (
        let layerDepth = 0;
        layerDepth < layers.length - 1;
        layerDepth++
    ) {
        // Get the later;
        const layer = layers[layerDepth];

        // Add opposite leaf to proof.
        proof.push(
            layer[
                _transactionIndex + (
                    // If the index is even, next index, otherwise prev index.
                    _transactionIndex % 2 == 0 ? 1 : -1
                )
            ],
        );

        // Shift right (like div by 2 and remove remainder).
        _transactionIndex = _transactionIndex >> 1;
    }

    return proof;
}

// Export the available methods.
module.exports = {
    computeMerkleTreeDepth,
    computeMerkleTreeWidth,
    computeInnerNode,
    computeTransactionLeaf,
    merkleTreeRoot,
    merkleProof,
    rightmostIndex,
};