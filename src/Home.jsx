import copy from 'clipboard-copy';
import axios from "axios";
import { useEffect, useRef, useState } from "react";

function Home() {
    const [history, setHistory] = useState([]);

    const [audioFile, setAudioFile] = useState(null);
    const [audioTranscript, setAudioTranscript] = useState("");
    const [liveTranscript, setLiveTranscript] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get("https://speech-to-text-inov.onrender.com/api/history", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setHistory(res.data);
            } catch (err) {
                console.error("Error fetching history:", err);
            }
        };

        fetchHistory();
    }, []);


    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const streamRef = useRef(null);

    const handleCopy = (targetText) => {
        if (targetText.trim()) {
            copy(targetText);
            alert("Text copied to clipboard!");
        }
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Your browser doesn't support audio recording.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
                const file = new File([blob], `live_recording_${Date.now()}.webm`, {
                    type: "audio/webm",
                });

                await handleLiveAudioUpload(file);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error(err);
            alert("Could not start recording: " + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);


            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        }
    };

    const handleAudioChange = (e) => {
        setAudioFile(e.target.files[0]);
    };

    const handleAudioUpload = async () => {
        if (!audioFile) return alert("Please select an audio file.");
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("audio", audioFile);

            const res = await axios.post("https://speech-to-text-inov.onrender.com/transcribe", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setAudioTranscript(res.data.text);
            // Save to backend
            try {
                await axios.post("https://speech-to-text-inov.onrender.com/api/history", {
                    type: "Upload",
                    text: res.data.text,
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
            } catch (err) {
                console.error("Failed to save upload history:", err);
            }

            setHistory((prev) => [
                ...prev,
                {
                    type: "Upload",
                    text: res.data.text,
                    time: new Date().toLocaleString(),
                },
            ]);

        } catch (err) {
            console.error(err);
            alert("Something went wrong during transcription.");
        } finally {
            setLoading(false);
        }
    };

    const handleLiveAudioUpload = async (file) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("audio", file);

            const res = await axios.post("https://speech-to-text-inov.onrender.com/transcribe", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setLiveTranscript(res.data.text);
            // Save to backend
            try {
                await axios.post("https://speech-to-text-inov.onrender.com/api/history", {
                    type: "Live",
                    text: res.data.text,
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
            } catch (err) {
                console.error("Failed to save live history:", err);
            }

            setHistory((prev) => [
                ...prev,
                {
                    type: "Live",
                    text: res.data.text,
                    time: new Date().toLocaleString(),
                },
            ]);

        } catch (err) {
            console.error(err);
            alert("Error transcribing recorded audio.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">🎤 Speech to Text</h2>
                <p className="text-gray-600 mt-2">Live microphone or audio file conversion</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">

                <div className="flex-1 bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="font-semibold text-xl mb-4 text-gray-800">🎙️ Live Speech</h3>
                    <p className="text-gray-700 h-40 overflow-y-auto whitespace-pre-wrap border p-3 rounded-md bg-gray-50">
                        {liveTranscript || "Your transcribed text will appear here..."}
                    </p>

                    <div className="flex gap-3 mt-4 flex-wrap">
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                Start Listening
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                            >
                                Stop
                            </button>
                        )}
                        <button
                            onClick={() => setLiveTranscript("")}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => handleCopy(liveTranscript)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Copy
                        </button>
                    </div>
                </div>


                <div className="flex-1 bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="font-semibold text-xl mb-4 text-gray-800">📁 Upload Audio</h3>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioChange}
                        className="mb-4 block"
                    />
                    <button
                        onClick={handleAudioUpload}
                        disabled={loading}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                        {loading ? "Transcribing..." : "Upload & Convert"}
                    </button>

                    {audioTranscript && (
                        <>
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">📝 Audio Text:</h4>
                                <p className="text-gray-700 whitespace-pre-wrap border p-3 rounded-md bg-gray-50 h-40 overflow-y-auto">
                                    {audioTranscript}
                                </p>
                            </div>
                            <button
                                onClick={() => handleCopy(audioTranscript)}
                                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Copy
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="max-w-6xl mx-auto mt-8 bg-white p-6 rounded-xl shadow-md border">
                <h3 className="font-semibold text-xl mb-4 text-gray-800">📜 Transcription History</h3>
                {history.length === 0 ? (
                    <p className="text-gray-600">No transcriptions yet.</p>
                ) : (
                    <ul className="space-y-4">
                        {history.map((item, idx) => (
                            <li key={idx} className="border p-3 rounded-md bg-gray-50">
                                <div className="text-sm text-gray-500 mb-1">
                                    <span className="font-medium">{item.type}</span> • {new Date(item.timestamp).toLocaleString()}
                                </div>
                                <div className="text-gray-800 whitespace-pre-wrap">{item.text}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </div>

    );
}

export default Home;
