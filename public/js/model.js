function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function runLogisticRegression(entries, currentEntry) {
  // Dynamically assign weights based on number of variables
  const variables = Object.keys(currentEntry);
  const weights = {};

  variables.forEach((varName) => {
    weights[varName] = Math.random() * 2 - 1; // Random weights for demo
  });

  let z = 0;
  variables.forEach((varName) => {
    z += currentEntry[varName] * weights[varName];
  });

  const probability = sigmoid(z);

  if (probability > 0.7) {
    return `Based on recent data, there's a ${(probability * 100).toFixed(
      1
    )}% chance of a notable event tomorrow.`;
  } else {
    return `No significant predictions today.`;
  }
}

module.exports = { runLogisticRegression };
