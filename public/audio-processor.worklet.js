/**
 * ZANOBOT - AUDIO WORKLET PROCESSOR
 *
 * Modern replacement for deprecated ScriptProcessorNode.
 * Runs on separate audio thread for better performance.
 *
 * Features:
 * - Real-time audio processing without main thread blocking
 * - Lower latency than ScriptProcessorNode
 * - Better performance for DSP operations
 */

class ZanobotAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Ring buffer for audio data
    this.bufferSize = 16384; // Large enough for chunk processing
    this.ringBuffer = new Float32Array(this.bufferSize);
    this.writePos = 0;

    // Smart Start state
    this.smartStartActive = false;
    this.warmUpStartTime = 0;
    this.warmUpDuration = 2000; // 2 seconds in ms
    this.signalThreshold = 0.02;
    this.maxWaitTime = 30000;
    this.waitStartTime = 0;
    this.phase = 'idle'; // idle, warmup, waiting, recording

    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  /**
   * Handle messages from main thread
   */
  handleMessage(message) {
    switch (message.type) {
      case 'start-smart-start':
        this.startSmartStart();
        break;
      case 'skip-to-recording':
        this.skipToRecording();
        break;
      case 'stop':
        this.phase = 'idle';
        this.smartStartActive = false;
        break;
      case 'reset-buffer':
        this.ringBuffer.fill(0);
        this.writePos = 0;
        break;
    }
  }

  /**
   * Start Smart Start sequence
   */
  startSmartStart() {
    this.smartStartActive = true;
    this.phase = 'warmup';
    this.warmUpStartTime = currentTime * 1000; // Convert to ms
    this.writePos = 0;
    this.ringBuffer.fill(0);

    this.port.postMessage({
      type: 'smart-start-state',
      phase: 'warmup',
      remainingWarmUp: this.warmUpDuration
    });
  }

  /**
   * Skip Smart Start and go directly to recording
   */
  skipToRecording() {
    this.phase = 'recording';
    this.smartStartActive = false;

    this.port.postMessage({
      type: 'smart-start-state',
      phase: 'recording'
    });
  }

  /**
   * Calculate RMS (Root Mean Square) of audio samples
   */
  calculateRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Process audio data (called for each audio block)
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // If no input, continue processing
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0]; // Mono channel
    const now = currentTime * 1000; // Convert to ms

    // Smart Start logic
    if (this.smartStartActive) {
      if (this.phase === 'warmup') {
        const elapsed = now - this.warmUpStartTime;
        const remaining = Math.max(0, this.warmUpDuration - elapsed);

        // Send status update (throttled - every 100ms)
        if (Math.floor(elapsed / 100) !== Math.floor((elapsed - 10) / 100)) {
          this.port.postMessage({
            type: 'smart-start-state',
            phase: 'warmup',
            remainingWarmUp: remaining
          });
        }

        if (elapsed >= this.warmUpDuration) {
          // Warm-up complete, start waiting for signal
          this.phase = 'waiting';
          this.waitStartTime = now;

          this.port.postMessage({
            type: 'smart-start-state',
            phase: 'waiting'
          });
        }

        // Discard audio during warm-up
        return true;
      }

      if (this.phase === 'waiting') {
        const waitElapsed = now - this.waitStartTime;

        // Check for timeout
        if (waitElapsed >= this.maxWaitTime) {
          this.port.postMessage({
            type: 'smart-start-timeout'
          });
          this.smartStartActive = false;
          this.phase = 'idle';
          return true;
        }

        // Check signal level
        const rms = this.calculateRMS(inputChannel);

        if (rms >= this.signalThreshold) {
          // Signal detected!
          this.phase = 'recording';
          this.smartStartActive = false;

          this.port.postMessage({
            type: 'smart-start-complete',
            rms: rms
          });
        }

        // Don't write to buffer during waiting
        if (this.phase === 'waiting') {
          return true;
        }
      }
    }

    // Normal recording mode (write to ring buffer)
    if (this.phase === 'recording') {
      for (let i = 0; i < inputChannel.length; i++) {
        this.ringBuffer[this.writePos] = inputChannel[i];
        this.writePos = (this.writePos + 1) % this.bufferSize;
      }

      // Send audio chunk to main thread for real-time processing
      // Transfer a copy of the data every ~14553 samples (330ms at 44.1kHz)
      // This matches the DSP window size for feature extraction
      const targetChunkSize = 14553;

      if (this.writePos % targetChunkSize === 0 && this.writePos >= targetChunkSize) {
        // Extract latest chunk
        const chunk = new Float32Array(targetChunkSize);

        let readPos = this.writePos - targetChunkSize;
        if (readPos < 0) {
          readPos += this.bufferSize;
        }

        for (let i = 0; i < targetChunkSize; i++) {
          chunk[i] = this.ringBuffer[readPos];
          readPos = (readPos + 1) % this.bufferSize;
        }

        // Transfer chunk to main thread
        this.port.postMessage({
          type: 'audio-chunk',
          chunk: chunk.buffer,
          writePos: this.writePos
        }, [chunk.buffer]); // Transfer ownership for zero-copy
      }
    }

    // Keep processor alive
    return true;
  }
}

// Register processor
registerProcessor('zanobot-audio-processor', ZanobotAudioProcessor);
