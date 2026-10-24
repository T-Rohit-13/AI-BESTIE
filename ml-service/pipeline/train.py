"""
INARO Tone & Emotion Analysis Model Trainer
Trains an emotional tone classifier and exports portable model checkpoints.
"""

import json
import math
import os
import re
from collections import defaultdict
from typing import Dict, List, Tuple
from dataset import get_training_dataset

class ToneClassifierModel:
    def __init__(self):
        self.classes: List[str] = ["sad", "happy", "angry", "anxious", "calm", "neutral"]
        self.class_priors: Dict[str, float] = {}
        self.word_probs: Dict[str, Dict[str, float]] = {}
        self.vocab: set = set()

    def tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 1]

    def train(self, data: List[Tuple[str, str]]):
        total_docs = len(data)
        class_doc_counts = defaultdict(int)
        class_word_counts = defaultdict(lambda: defaultdict(int))
        class_total_words = defaultdict(int)

        for text, label in data:
            class_doc_counts[label] += 1
            tokens = self.tokenize(text)
            for token in tokens:
                self.vocab.add(token)
                class_word_counts[label][token] += 1
                class_total_words[label] += 1

        # Calculate class prior probabilities P(C)
        for c in self.classes:
            self.class_priors[c] = class_doc_counts[c] / float(total_docs)

        # Calculate word probabilities with Laplace smoothing P(W|C)
        vocab_size = len(self.vocab)
        for c in self.classes:
            self.word_probs[c] = {}
            denom = class_total_words[c] + vocab_size
            for w in self.vocab:
                count = class_word_counts[c][w]
                self.word_probs[c][w] = (count + 1.0) / float(denom)

    def predict(self, text: str) -> Dict[str, float]:
        tokens = self.tokenize(text)
        log_probs = {}

        for c in self.classes:
            prior = self.class_priors.get(c, 1e-5)
            log_prob = math.log(prior)

            for token in tokens:
                if token in self.word_probs[c]:
                    log_prob += math.log(self.word_probs[c][token])

            log_probs[c] = log_prob

        # Softmax normalization for confidence probabilities
        max_log = max(log_probs.values())
        exp_scores = {c: math.exp(score - max_log) for c, score in log_probs.items()}
        sum_exp = sum(exp_scores.values())

        return {c: exp_scores[c] / sum_exp for c in self.classes}

    def save_checkpoint(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        payload = {
            "classes": self.classes,
            "class_priors": self.class_priors,
            "word_probs": self.word_probs,
            "vocab": list(self.vocab),
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        print(f"[ToneClassifier] Saved checkpoint to: {filepath}")

def main():
    print("[INARO ML Pipeline] Generating dataset and training tone classifier...")
    dataset = get_training_dataset()
    print(f"[INARO ML Pipeline] Loaded {len(dataset)} labeled emotional samples.")

    model = ToneClassifierModel()
    model.train(dataset)

    # Save to checkpoints
    base_dir = os.path.dirname(os.path.abspath(__file__))
    checkpoint_path = os.path.join(base_dir, "..", "models", "checkpoints", "tone_classifier.json")
    model.save_checkpoint(checkpoint_path)

    # Test sample evaluation
    test_samples = [
        "I feel so heavy and alone, I just broke down in tears",
        "Got selected for the hackathon team, so proud and happy!",
        "This is so unfair, they lied and cheated me, I am so angry",
        "My hands are shaking, I am terrified of failing tomorrow",
        "Sitting quietly breathing the fresh morning air, feeling at peace",
    ]

    print("\n--- Model Validation Inference ---")
    for sample in test_samples:
        scores = model.predict(sample)
        top_tone = max(scores.items(), key=lambda x: x[1])
        print(f"Text: '{sample}'\n  => Predicted Tone: {top_tone[0].upper()} (Confidence: {top_tone[1]:.2f})\n")

if __name__ == "__main__":
    main()
