// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Music directory where audio files are stored
const musicDirectory = path.join(__dirname, 'music');

// Endpoint to get the list of available tracks
app.get('/api/tracks', (req, res) => {
  fs.readdir(musicDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read music directory' });
    }
    // Filter for audio files (e.g., .mp3)
    const audioFiles = files.filter(file => file.endsWith('.mp3')).map(file => {
      return {
        title: file,
        url: `/stream/${file}`
      };
    });
    res.json(audioFiles);
  });
});

// Endpoint to stream the audio files
app.get('/stream/:track', (req, res) => {
  const { track } = req.params;
  const filePath = path.join(musicDirectory, track);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const range = req.headers.range;
    if (!range) {
      return res.status(400).json({ error: 'Requires Range header' });
    }

    const fileSize = stats.size;
    const chunkSize = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + chunkSize, fileSize - 1);

    const stream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'audio/mpeg',
    });
    stream.pipe(res);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
