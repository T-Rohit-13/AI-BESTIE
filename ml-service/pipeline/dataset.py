"""
INARO Tone & Emotion Analysis Dataset Generator
Generates curated, balanced, multi-class emotional utterances for teenagers & college students.
"""

from typing import List, Tuple

# Labeled emotional training dataset: (utterance, tone_label)
TRAINING_DATA: List[Tuple[str, str]] = [
    # --- SAD ---
    ("I feel so alone in this hostel and nobody seems to notice", "sad"),
    ("I cried in the bathroom today after failing my exam", "sad"),
    ("Everything feels so heavy and I have no energy to get out of bed", "sad"),
    ("I miss my family so much and I feel like a disappointment", "sad"),
    ("Why does it feel like everyone is moving forward except me?", "sad"),
    ("Heartbroken after what my best friend said to me", "sad"),
    ("I feel completely drained and sorrowful today", "sad"),
    ("My heart just aches and I don't know who to talk to", "sad"),
    ("Nothing brings me joy lately, just feeling numb and sad", "sad"),
    ("கண்ணீர் வருகிறது, மிகவும் சோகமாக உணர்கிறேன்", "sad"),
    ("யாரும் என்னைப் புரிந்து கொள்ளவில்லை", "sad"),

    # --- HAPPY ---
    ("I aced my semester presentation and the professor praised me!", "happy"),
    ("Had the most incredible day hanging out with my friends", "happy"),
    ("Finally got the internship offer I worked so hard for!", "happy"),
    ("Feeling so grateful and joyful today, life is good", "happy"),
    ("I laughed so hard today my stomach hurts, what a great day", "happy"),
    ("Proud of myself for completing that difficult assignment", "happy"),
    ("Woke up feeling refreshed, motivated, and happy", "happy"),
    ("Such a beautiful sunset today, feeling blessed and peaceful", "happy"),
    ("இன்று மிகவும் மகிழ்ச்சியாக இருக்கிறது", "happy"),
    ("வெற்றி பெற்றதில் பெருமகிழ்ச்சி அடைகிறேன்", "happy"),

    # --- ANGRY ---
    ("I hate how unfair this grading system is, it makes me furious", "angry"),
    ("My roommate was so disrespectful and loud, I am so mad", "angry"),
    ("I want to scream at the top of my lungs, so frustrated", "angry"),
    ("They lied right to my face and cheated me", "angry"),
    ("Sick and tired of being taken for granted by everyone", "angry"),
    ("So angry right now, I can't even stand to look at them", "angry"),
    ("Why do people have to be so cruel and selfish?", "angry"),
    ("எனக்கு மிகுந்த கோபம் வருகிறது", "angry"),
    ("இவ்வளவு அநியாயமாக நடப்பதை பொறுக்க முடியவில்லை", "angry"),

    # --- ANXIOUS ---
    ("My heart is racing and I can't calm down before the viva", "anxious"),
    ("So nervous about the interview tomorrow, what if I freeze?", "anxious"),
    ("Overwhelmed with deadlines, I feel like I can't breathe", "anxious"),
    ("Panic attack hitting me again, feeling terrified", "anxious"),
    ("Constantly worried about my future and what happens next", "anxious"),
    ("Shaking and anxious, there is too much pressure on me", "anxious"),
    ("Scared that I am going to ruin everything", "anxious"),
    ("மனப்பதட்டம் அதிகமாக உள்ளது, பயமாக இருக்கிறது", "anxious"),
    ("மூச்சு திணறுவது போல பதட்டமாக உள்ளது", "anxious"),

    # --- CALM ---
    ("Took a long peaceful walk in the garden, feeling centered", "calm"),
    ("Sitting with my cup of tea listening to the rain, all is well", "calm"),
    ("Practiced deep breathing exercises and feeling very relaxed", "calm"),
    ("Tranquil evening, mind is clear and settled", "calm"),
    ("Accepting things as they are and letting go of stress", "calm"),
    ("Quiet moment to myself, perfectly at peace", "calm"),
    ("அமைதியாக இருக்கிறேன், மனம் நிம்மதியாக உள்ளது", "calm"),

    # --- NEUTRAL ---
    ("Today was a regular day of lectures and library study", "neutral"),
    ("Wrote down my schedule for the upcoming week", "neutral"),
    ("Had lunch at the campus canteen and went back to class", "neutral"),
    ("Checking the bus timings for tomorrow morning", "neutral"),
    ("Need to purchase some new notebooks for college", "neutral"),
    ("வழக்கமான ஒரு நாள், கல்லூரிக்கு சென்று வந்தேன்", "neutral"),
]

def get_training_dataset():
    return TRAINING_DATA
