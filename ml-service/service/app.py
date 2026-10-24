import json
import math
import os
import re
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="INARO Tone & Emotion Analysis Microservice",
    description="Analyzes user text and vocal tone to determine emotional mode and avatar parameters.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AudioFeatures(BaseModel):
    pitch: Optional[float] = None
    rms: Optional[float] = None

class ToneAnalysisRequest(BaseModel):
    text: Optional[str] = None
    audioFeatures: Optional[AudioFeatures] = None

class AvatarParameters(BaseModel):
    brow: float
    smile: float
    eye: float
    auraColor: string = "#c084fc"
    expression: str

class ToneAnalysisResponse(BaseModel):
    tone: str
    mood: str
    confidence: float
    valence: float
    arousal: float
    avatarParameters: Dict[str, object]

# Load trained checkpoint
MODEL_DATA = None
checkpoint_path = os.path.join(
    os.path.dirname(__file__), "..", "models", "checkpoints", "tone_classifier.json"
)

if os.path.exists(checkpoint_path):
    with open(checkpoint_path, "r", encoding="utf-8") as f:
        MODEL_DATA = json.load(f)

def tokenize(text: str) -> List[str]:
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    return [w for w in cleaned.split() if len(w) > 1]

def predict_probabilities(text: str) -> Dict[str, float]:
    if not MODEL_DATA or not text.strip():
        return {"neutral": 1.0}

    classes = MODEL_DATA["classes"]
    class_priors = MODEL_DATA["class_priors"]
    word_probs = MODEL_DATA["word_probs"]
    tokens = tokenize(text)

    log_probs = {}
    for c in classes:
        prior = class_priors.get(c, 1e-5)
        log_prob = math.log(prior)
        for token in tokens:
            if token in word_probs.get(c, {}):
                log_prob += math.log(word_probs[c][token])
        log_probs[c] = log_prob

    max_log = max(log_probs.values())
    exp_scores = {c: math.exp(score - max_log) for c, score in log_probs.items()}
    sum_exp = sum(exp_scores.values())

    return {c: exp_scores[c] / sum_exp for c in classes}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "INARO Tone Analysis ML Service"}

@app.post("/api/v1/analyze-tone", response_model=ToneAnalysisResponse)
def analyze_tone(payload: ToneAnalysisRequest):
    text = payload.text or ""
    probs = predict_probabilities(text)
    top_tone, confidence = max(probs.items(), key=lambda x: x[1])

    # Acoustic adjustments if provided
    if payload.audioFeatures:
        pitch = payload.audioFeatures.pitch or 0
        rms = payload.audioFeatures.rms or 0
        if rms > 0.35 and pitch > 240:
            top_tone = "angry"
            confidence = max(confidence, 0.88)
        elif pitch > 260 and rms < 0.25:
            top_tone = "anxious"
            confidence = max(confidence, 0.85)

    # Avatar parameter mapping
    avatar_configs = {
        "calm": {
            "brow": 0.0,
            "smile": 0.25,
            "eye": 0.35,
            "auraColor": "rgba(168, 85, 247, 0.25)",
            "expression": "calm",
            "valence": 0.3,
            "arousal": 0.2,
        },
        "sad": {
            "brow": -0.6,
            "smile": -0.2,
            "eye": 0.75,
            "auraColor": "rgba(96, 165, 250, 0.35)",
            "expression": "sad",
            "valence": -0.7,
            "arousal": 0.35,
        },
        "angry": {
            "brow": 0.5,
            "smile": 0.1,
            "eye": 0.85,
            "auraColor": "rgba(52, 211, 153, 0.35)",
            "expression": "angry",
            "valence": -0.6,
            "arousal": 0.85,
        },
        "anxious": {
            "brow": -0.3,
            "smile": 0.0,
            "eye": 0.9,
            "auraColor": "rgba(45, 212, 191, 0.35)",
            "expression": "anxious",
            "valence": -0.5,
            "arousal": 0.7,
        },
        "happy": {
            "brow": 0.1,
            "smile": 0.7,
            "eye": 0.8,
            "auraColor": "rgba(251, 146, 60, 0.35)",
            "expression": "happy",
            "valence": 0.85,
            "arousal": 0.75,
        },
        "neutral": {
            "brow": 0.0,
            "smile": 0.2,
            "eye": 0.65,
            "auraColor": "rgba(192, 132, 252, 0.2)",
            "expression": "neutral",
            "valence": 0.0,
            "arousal": 0.3,
        },
    }

    config = avatar_configs.get(top_tone, avatar_configs["neutral"])

    return ToneAnalysisResponse(
        tone=top_tone,
        mood=top_tone,
        confidence=round(confidence, 2),
        valence=config["valence"],
        arousal=config["arousal"],
        avatarParameters={
            "brow": config["brow"],
            "smile": config["smile"],
            "eye": config["eye"],
            "auraColor": config["auraColor"],
            "expression": config["expression"],
        },
    )
