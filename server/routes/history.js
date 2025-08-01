import express from "express";
import History from "../models/History.js";
import { verifyToken } from "../Middleware/middleware.js";

const router = express.Router();


router.post("/", verifyToken, async (req, res) => {
    try {
        const { type, text } = req.body;

        const newHistory = new History({
            userId: req.userId,
            type,
            text,
        });

        await newHistory.save();
        res.status(201).json(newHistory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error saving history" });
    }
});


router.get("/", verifyToken, async (req, res) => {
    try {
        const history = await History.find({ userId: req.userId }).sort({ timestamp: -1 });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching history" });
    }
});

export default router;
