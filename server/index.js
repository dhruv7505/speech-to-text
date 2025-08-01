import express from "express";
import mongoose from "mongoose";
import axios from 'axios';
import dotenv from "dotenv";
import cors from "cors";
import fs from 'fs';
import authRoutes from "./routes/Auth.js";
import multer from "multer";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => console.error("MongoDB connection error:", err));
app.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        const API_KEY = process.env.ASSEMBLY_API_KEY;
        const filePath = req.file.path;


        const fileData = fs.readFileSync(filePath);
        const uploadRes = await axios.post(
            'https://api.assemblyai.com/v2/upload',
            fileData,
            {
                headers: {
                    authorization: API_KEY,
                    'content-type': 'application/octet-stream',
                },
            }
        );


        const transcriptRes = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            {
                audio_url: uploadRes.data.upload_url,
            },
            {
                headers: {
                    authorization: API_KEY,
                    'content-type': 'application/json',
                },
            }
        );

        const transcriptId = transcriptRes.data.id;


        let completed = false;
        let transcriptText = '';

        while (!completed) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const pollingRes = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                {
                    headers: { authorization: API_KEY },
                }
            );

            if (pollingRes.data.status === 'completed') {
                completed = true;
                transcriptText = pollingRes.data.text;
            } else if (pollingRes.data.status === 'error') {
                throw new Error('Transcription failed');
            }
        }

        fs.unlinkSync(filePath);

        return res.json({ text: transcriptText });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Transcription failed' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
