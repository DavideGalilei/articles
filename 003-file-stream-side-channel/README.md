---
title: 'JavaScript Obfuscation Through File Stream Side-Channel'
date: '5 May 2025'
tags: ['blog', 'security', 'web', 'obfuscation', 'fun']
visibility: 'public'
description: 'Obfuscating JavaScript code in webpages using file stream side-channel techniques.'
---

I was recently reverse engineering a website that attempts to block devtools and obfuscates its API through HTML/CSS/JS blobs.
Suddenly, a random thought crossed my mind: "If one goes as far as making it that obnoxious to reverse engineer a website, why not stepping it up a notch and obfuscating the JavaScript code in the webpage using file stream side-channel techniques?".

## The Idea
Browsers load files as a stream from the server, in fact, it is possible to programmatically read the stream in real-time from JavaScript code.
It is possible to encode JavaScript code (or anything, for the matter) to binary code (e.g. `10101110`), and translate each `0` to a short delay, and each `1` to a long delay, similarly to morse code.

By being able to read a stream of bytes in real time, such as the stream of a `style.css` file being loaded, it is also possible to measure those delays and decode them back to binary code, then decoding this binary code back to JS Code and execute it.

## Demo

<video src="./media/demo.webm" autoplay loop muted controls></video>

> You can find the code for this demo [here](./code/).

## What is going on?

To have a better understanding of how this works, try to play around with the widget below. It doesn't actually send requests to the server, but simulates locally the stream of a file being loaded.

> [!NOTE]
> Widget removed in the GitHub version of this article. Try it [here](https://blog.gavide.dev/blog/file-stream-side-channel).

## Potential Improvements
- Custom headers to hide the stream from tools such as BurpSuite
- Load images or binary files instead of `style.css`, as to have a more realistic stream
- Compress the data to reduce the delay of the stream
- Multiple streams for faster decoding, e.g. multiple images being loaded in background
- Checksum to verify the stream integrity, or error correction codes
- Use encryption

## Potential Issues
Security through obscurity is never a good idea, it only makes it harder to reverse engineer, not impossible. If your browser can read the stream, so can a reverse engineer with a bit of patience.

Reverse proxies and real world conditions may affect the timing of the stream, making this technique unreliable or impractical in some cases.
