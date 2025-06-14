/**
 * Rate limiter utility for Firebase operations
 * Helps prevent "too-many-requests" errors during bulk operations
 */

/**
 * Delays execution for a specified number of milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after the delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes operations in batches with delays to prevent rate limiting
 * @param {Array} items - Array of items to process
 * @param {Function} operation - Async function to execute for each item
 * @param {Object} options - Configuration options
 * @param {number} options.batchSize - Number of items to process in each batch (default: 5)
 * @param {number} options.delayBetweenBatches - Delay in ms between batches (default: 2000)
 * @param {number} options.delayBetweenItems - Delay in ms between individual items (default: 500)
 * @param {Function} options.onProgress - Progress callback function
 * @param {Function} options.onBatchComplete - Batch completion callback
 * @returns {Promise<Object>} - Results object with success/error counts
 */
export const executeBatchedOperations = async (items, operation, options = {}) => {
  const {
    batchSize = 5,
    delayBetweenBatches = 2000,
    delayBetweenItems = 500,
    onProgress = null,
    onBatchComplete = null
  } = options;

  const results = {
    success: 0,
    errors: [],
    total: items.length
  };

  console.log(`Starting batched operations for ${items.length} items`);
  console.log(`Batch size: ${batchSize}, Delay between batches: ${delayBetweenBatches}ms, Delay between items: ${delayBetweenItems}ms`);

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(items.length / batchSize);

    console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

    // Process each item in the current batch
    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const overallIndex = i + j;

      try {
        // Call progress callback
        if (onProgress) {
          onProgress({
            current: overallIndex + 1,
            total: items.length,
            currentItem: item,
            batchNumber,
            totalBatches,
            percentage: Math.round(((overallIndex + 1) / items.length) * 100)
          });
        }

        console.log(`Processing item ${overallIndex + 1}/${items.length}`);

        // Execute the operation
        await operation(item, overallIndex);
        results.success++;

        console.log(`Successfully processed item ${overallIndex + 1}`);

        // Add delay between items (except for the last item in the batch)
        if (j < batch.length - 1) {
          await delay(delayBetweenItems);
        }

      } catch (error) {
        console.error(`Failed to process item ${overallIndex + 1}:`, error);
        results.errors.push({
          index: overallIndex,
          item,
          error: error.message
        });
      }
    }

    // Call batch completion callback
    if (onBatchComplete) {
      onBatchComplete({
        batchNumber,
        totalBatches,
        batchSize: batch.length,
        successCount: results.success,
        errorCount: results.errors.length
      });
    }

    console.log(`Completed batch ${batchNumber}/${totalBatches}`);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < items.length) {
      console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
      await delay(delayBetweenBatches);
    }
  }

  console.log(`Batched operations completed!`);
  console.log(`Results: ${results.success} successful, ${results.errors.length} failed`);

  return results;
};

/**
 * Executes operations with exponential backoff retry logic
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms for exponential backoff (default: 1000)
 * @param {Array} options.retryableErrors - Array of error codes/messages to retry on
 * @returns {Promise} - Result of the operation
 */
export const executeWithRetry = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    retryableErrors = ['auth/too-many-requests', 'RATE_LIMIT_EXCEEDED', 'quota-exceeded']
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if this is a retryable error
      const isRetryable = retryableErrors.some(retryableError => 
        error.code?.includes(retryableError) || 
        error.message?.includes(retryableError)
      );

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.log(`Retryable error on attempt ${attempt + 1}/${maxRetries + 1}: ${error.message}`);
      console.log(`Retrying in ${delayMs}ms...`);
      
      await delay(delayMs);
    }
  }

  throw lastError;
};

/**
 * Combines batched operations with retry logic for maximum reliability
 * @param {Array} items - Array of items to process
 * @param {Function} operation - Async function to execute for each item
 * @param {Object} options - Configuration options (combines both batching and retry options)
 * @returns {Promise<Object>} - Results object
 */
export const executeBatchedOperationsWithRetry = async (items, operation, options = {}) => {
  const batchOptions = {
    batchSize: options.batchSize || 3, // Smaller batch size for retry operations
    delayBetweenBatches: options.delayBetweenBatches || 3000, // Longer delays for retry operations
    delayBetweenItems: options.delayBetweenItems || 1000,
    onProgress: options.onProgress,
    onBatchComplete: options.onBatchComplete
  };

  const retryOptions = {
    maxRetries: options.maxRetries || 3,
    baseDelay: options.baseDelay || 1000,
    retryableErrors: options.retryableErrors
  };

  // Wrap the operation with retry logic
  const operationWithRetry = async (item, index) => {
    return await executeWithRetry(() => operation(item, index), retryOptions);
  };

  return await executeBatchedOperations(items, operationWithRetry, batchOptions);
}; 