const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/script.js');
});

// CSS endpoint that streams with controlled timing
app.get('/style.css', (req, res) => {
  // The secret message to transmit (in binary) - alert(1)
  const secretBinary = '0110000101101100011001010111001001110100001010000011000100101001';

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Transfer-Encoding', 'chunked');

  // CSS content to send (we'll send it character by character)
  const cssContent = 'body { color: black; background-color: white; font-family: Arial, sans-serif; margin: 0; padding: 20px; }';

  // Send a preamble to help calibrate timing detection
  res.write('/* PREAMBLE: 10101010 */\n');

  // Use much larger delays to make detection easier
  const SHORT_DELAY = 70;  // 100ms for bit 0
  const LONG_DELAY = 140;   // 300ms for bit 1

  // Send each character with controlled timing
  let charIndex = 0;
  let bitIndex = 0;

  function sendNextChar() {
    if (charIndex < cssContent.length && bitIndex < secretBinary.length) {
      // Get current character and bit
      const char = cssContent[charIndex];
      const bit = secretBinary[bitIndex];

      // Delay based on bit value (1 = longer delay, 0 = shorter delay)
      const delay = bit === '1' ? LONG_DELAY : SHORT_DELAY;

      setTimeout(() => {
        res.write(char);
        charIndex++;
        bitIndex++;
        sendNextChar();
      }, delay);
    } else if (charIndex < cssContent.length) {
      // Finished bits but still have CSS to send - send the rest quickly
      res.write(cssContent.substring(charIndex));
      res.end();
    } else {
      // Finished sending everything
      res.end();
    }
  }

  // Start sending characters
  sendNextChar();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
