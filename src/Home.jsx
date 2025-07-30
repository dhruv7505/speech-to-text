import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import copy from 'clipboard-copy';
import axios from "axios";
import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_ASSEMBLY_API_KEY;

function Home() {
    const { transcript, browserSupportsSpeechRecognition, resetTranscript } = useSpeechRecognition();
    const [text, setText] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [audioTranscript, setAudioTranscript] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setText(transcript);
    }, [transcript]);

    const handleCopy = (targetText) => {
        if (targetText.trim()) {
            copy(targetText);
            alert("Text copied to clipboard!");
        }
    };

    const handleClear = () => {
        resetTranscript();
        setText("");
    };

    const startListening = () =>
        SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });

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
        } catch (err) {
            console.error(err);
            alert("Something went wrong during transcription.");
        } finally {
            setLoading(false);
        }
    };


    if (!browserSupportsSpeechRecognition) {
        return <span>Your browser does not support speech recognition.</span>;
    }

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
                        {text.trim() || "Your transcribed text will appear here..."}
                    </p>

                    <div className="flex gap-3 mt-4 flex-wrap">
                        <button
                            onClick={startListening}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Start Listening
                        </button>
                        <button
                            onClick={SpeechRecognition.stopListening}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                        >
                            Stop
                        </button>
                        <button
                            onClick={handleClear}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => handleCopy(text)}
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
        </div>
    );
}

export default Home;
