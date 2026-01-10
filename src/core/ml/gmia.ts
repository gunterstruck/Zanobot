/**
 * ZANOBOT - GMIA (Gaussian Model Independent Attributes)
 *
 * The CORE machine learning algorithm for acoustic diagnostics.
 *
 * Reference: Technical Report Section 2.3, Equation 2
 * Formula: w_p(λ) = X_p * (X_p^T * X_p + λI)^(-1) * 1
 *
 * Where:
 * - X_p: Feature matrix (512 x N) - features as rows, samples as columns
 * - λ: Regularization parameter = 10^9 (from Report p.25)
 * - 1: Ones vector
 * - w_p: Weight vector (learned model)
 */

import {
  matrixMultiply,
  matrixTranspose,
  matrixInverse,
  addRegularization,
  onesVector,
  matrixVectorMultiply,
  cosineSimilarity,
  mean,
  featuresToMatrix,
} from './mathUtils.js';

import type { GMIAModel, FeatureVector, TrainingData } from '@data/types.js';

/**
 * Regularization parameter from Technical Report (p.25)
 * "regularization factor lambda was set of 10^9"
 */
const LAMBDA = 1e9;

/**
 * Train GMIA model from reference audio
 *
 * This creates the "fingerprint" of a healthy machine.
 *
 * @param trainingData - Feature vectors from reference recording
 * @param machineId - Machine identifier
 * @returns Trained GMIA model
 */
export function trainGMIA(trainingData: TrainingData, machineId: string): GMIAModel {
  console.log(`🧠 Training GMIA model for machine ${machineId}...`);

  const features = trainingData.featureVectors;

  if (features.length === 0) {
    throw new Error('Cannot train model with empty feature set');
  }

  const numSamples = features.length;
  const featureDim = features[0].length;

  console.log(`   Features: ${featureDim} dimensions, ${numSamples} samples`);

  // Step 1: Convert features to matrix X_p (features as rows, samples as columns)
  const X_p = featuresToMatrix(features);

  console.log(`   Matrix X_p: ${X_p.length}x${X_p[0].length}`);

  // Step 2: Compute X_p^T (transpose)
  const X_p_T = matrixTranspose(X_p);

  // Step 3: Compute X_p^T * X_p (gram matrix)
  const gramMatrix = matrixMultiply(X_p_T, X_p);

  console.log(`   Gram matrix: ${gramMatrix.length}x${gramMatrix[0].length}`);

  // Step 4: Add regularization: X_p^T * X_p + λI
  const regularized = addRegularization(gramMatrix, LAMBDA);

  console.log(`   Regularization: λ = ${LAMBDA}`);

  // Step 5: Invert: (X_p^T * X_p + λI)^(-1)
  const inverted = matrixInverse(regularized);

  // Step 6: Create ones vector
  const ones = onesVector(numSamples);

  // Step 7: Multiply inverted matrix with ones vector
  const temp = matrixVectorMultiply(inverted, ones);

  // Step 8: Multiply X_p with temp to get weight vector
  const weightVector = matrixVectorMultiply(X_p, temp);

  console.log(`   Weight vector: ${weightVector.length} dimensions`);

  // Step 9: Calculate scaling constant C for tanh
  const scalingConstant = calculateScalingConstant(features, weightVector);

  console.log(`   Scaling constant C: ${scalingConstant.toFixed(6)}`);

  // Step 10: Calculate mean cosine similarity for metadata
  const cosineSimilarities = features.map((f) => cosineSimilarity(weightVector, f));
  const meanCosine = mean(cosineSimilarities);

  console.log(`   Mean cosine similarity: ${meanCosine.toFixed(4)}`);
  console.log(`✅ GMIA model trained successfully!`);

  return {
    machineId,
    weightVector,
    regularization: LAMBDA,
    scalingConstant,
    featureDimension: featureDim,
    trainingDate: Date.now(),
    trainingDuration: trainingData.config.windowSize * numSamples,
    sampleRate: trainingData.config.sampleRate,
    metadata: {
      meanCosineSimilarity: meanCosine,
      targetScore: 0.9, // Target 90% health score for reference data
    },
  };
}

/**
 * Calculate scaling constant C for tanh transformation
 *
 * Reference: Technical Report Appendix B
 *
 * Goal: Average health score of training data should be ~90%
 *
 * Steps:
 * 1. Calculate mean cosine similarity μ of training data
 * 2. Solve for t using: t = (√(0.9) + 1) / (√(0.9) - 1)
 * 3. Calculate C = ln(t) / (2 * μ)
 *
 * @param features - Training feature vectors
 * @param weightVector - Trained weight vector
 * @returns Scaling constant C
 */
function calculateScalingConstant(
  features: Float64Array[],
  weightVector: Float64Array
): number {
  // Calculate mean cosine similarity (μ)
  const cosineSimilarities = features.map((f) => cosineSimilarity(weightVector, f));
  const mu = mean(cosineSimilarities);

  // Target score (0.9 = 90%)
  const targetScore = 0.9;

  // Solve for t using quadratic equation from Appendix B
  // Score = (tanh(C * μ))^2 = targetScore
  // tanh(C * μ) = √targetScore
  // Inverse: C * μ = atanh(√targetScore)
  // C = atanh(√targetScore) / μ

  const sqrtTarget = Math.sqrt(targetScore);
  const atanhValue = Math.atanh(sqrtTarget);

  const C = atanhValue / mu;

  return C;
}

/**
 * Perform inference on new audio data
 *
 * Compare test features against trained model.
 *
 * @param model - Trained GMIA model
 * @param testFeatures - Features from test recording
 * @returns Array of cosine similarities (one per chunk)
 */
export function inferGMIA(model: GMIAModel, testFeatures: FeatureVector[]): number[] {
  const cosineSimilarities = testFeatures.map((featureVector) =>
    cosineSimilarity(model.weightVector, featureVector.features)
  );

  return cosineSimilarities;
}

/**
 * Calculate average cosine similarity from inference results
 *
 * @param cosineSimilarities - Array of cosine values
 * @returns Average cosine similarity
 */
export function averageCosineSimilarity(cosineSimilarities: number[]): number {
  return mean(cosineSimilarities);
}
