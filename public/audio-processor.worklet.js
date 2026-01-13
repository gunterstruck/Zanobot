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

    // Smart Start state
    this.smartStartActive = false;
    this.warmUpStartTime = 0;
    this.warmUpDuration = 5000; // Default 5s, will be overridden via 'init' message
    this.signalThreshold = 0.02;
    this.maxWaitTime = 30000;
    this.waitStartTime = 0;
    this.phase = 'idle'; // idle, warmup, waiting, recording

    // Dynamic chunk size based on actual sample rate
    // Will be set via 'init' message from manager
    this.sampleRate = 44100; // Default, will be overridden
    this.chunkSize = Math.floor(0.330 * this.sampleRate); // 330ms window

    // CRITICAL FIX: Ring buffer size must be larger than chunkSize
    // At 96kHz: chunkSize = 31680 samples
    // We need bufferSize >= chunkSize for proper circular buffer operation
    // Use 2x chunkSize as safety margin for high sample rates
    this.bufferSize = Math.max(32768, this.chunkSize * 2); // Minimum 32768 or 2x chunkSize
    this.ringBuffer = new Float32Array(this.bufferSize);
    this.writePos = 0;
    this.readPos = 0;
    this.samplesWritten = 0; // Track total samples written to detect wrap-around

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
      case 'init':
        // Initialize with actual sample rate from AudioContext
        if (message.sampleRate) {
          this.sampleRate = message.sampleRate;
          this.chunkSize = Math.floor(0.330 * this.sampleRate);

          // CRITICAL FIX: Resize ring buffer based on actual chunk size
          // This ensures bufferSize >= chunkSize at all sample rates
          this.bufferSize = Math.max(32768, this.chunkSize * 2);
          this.ringBuffer = new Float32Array(this.bufferSize);
          this.writePos = 0;
          this.readPos = 0;
          this.samplesWritten = 0;

          // CRITICAL FIX: Set warmUpDuration from config (Single Source of Truth)
          // This prevents hardcoded values and ensures consistency across pipeline
          if (message.warmUpDuration) {
            this.warmUpDuration = message.warmUpDuration;
          }

          // Acknowledge initialization
          this.port.postMessage({
            type: 'init-complete',
            sampleRate: this.sampleRate,
            chunkSize: this.chunkSize,
            bufferSize: this.bufferSize,
            warmUpDuration: this.warmUpDuration
          });
        }
        break;
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
        this.readPos = 0;
        this.samplesWritten = 0;
        break;
    }
  }

  /**
   * Start Smart Start sequence
   */
  startSmartStart() {
    this.smartStartActive = true;
    this.phase = 'warmup';
    this.warmUpStartTime = performance.now(); // Use performance.now() for timing
    this.writePos = 0;
    this.readPos = 0;
    this.samplesWritten = 0;
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
    this.writePos = 0;
    this.readPos = 0;
    this.samplesWritten = 0;
    this.ringBuffer.fill(0);

    this.port.postMessage({
      type: 'smart-start-state',
      phase: 'recording'
    });
  }

  /**
   * Calculate RMS (Root Mean Square) of audio samples
   */
  calculateRMS(samples) {
    if (!samples || samples.length === 0) {
      return 0;
    }
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
    const now = performance.now(); // Use performance.now() for timing

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
      // Write samples to ring buffer
      for (let i = 0; i < inputChannel.length; i++) {
        this.ringBuffer[this.writePos] = inputChannel[i];
        this.writePos = (this.writePos + 1) % this.bufferSize;
        this.samplesWritten++;
      }

      // Send audio chunk to main thread for real-time processing
      // Transfer a copy of the data every ~chunkSize samples (330ms at actual sample rate)
      // This matches the DSP window size for feature extraction
      // CRITICAL FIX: Use dynamic chunk size based on actual sample rate
      // - At 44.1kHz: ~14553 samples
      // - At 48kHz: ~15840 samples

      // CRITICAL FIX: Improved chunk triggering logic
      // Instead of relying on samplesWritten % chunkSize === 0 (which rarely triggers
      // because AudioWorklet processes in 128-sample blocks and chunkSize is not a multiple of 128),
      // we track the last chunk delivery and trigger when enough samples have accumulated.
      // Calculate how many samples have been written since last chunk delivery
      const samplesSinceLastChunk = this.samplesWritten - this.readPos;

      if (samplesSinceLastChunk >= this.chunkSize) {
        // Extract chunk from readPos (not from writePos backwards!)
        // This ensures we process all data sequentially without gaps
        const chunk = new Float32Array(this.chunkSize);

        // FIXED: Read from readPos forward, not from writePos backward
        // Calculate read position in circular buffer
        let chunkReadPos = this.readPos % this.bufferSize;

        // Copy data from circular buffer, handling wrap-around
        for (let i = 0; i < this.chunkSize; i++) {
          chunk[i] = this.ringBuffer[chunkReadPos];
          chunkReadPos = (chunkReadPos + 1) % this.bufferSize;
        }

        // FIXED: Increment readPos by chunkSize (not set to samplesWritten)
        // This ensures we process all data without skipping samples
        this.readPos += this.chunkSize;

        // CRITICAL FIX: Send audio-data-ready message BEFORE audio-chunk
        // This maintains API consistency with AudioWorkletManager expectations
        // Manager can sync currentWritePos before receiving the chunk
        this.port.postMessage({
          type: 'audio-data-ready',
          writePos: this.writePos
        });

        // Transfer chunk to main thread (with writePos for redundancy)
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
