// src/server.ts
import express from 'express';
import imageRoutes from './routes/imageRoutes.js';

const app = express();
const port = 3000;

// Use the routes
app.use('/', imageRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
