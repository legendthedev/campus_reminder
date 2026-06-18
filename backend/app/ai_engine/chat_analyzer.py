"""
AI Engine — Chat Transcript Analysis

Analyzes chat messages to predict delivery milestones,
flag potential disputes, and extract actionable insights.
"""

import re
from datetime import datetime, timedelta

DISPUTE_KEYWORDS = [
    "refund", "wrong", "damaged", "late", "complaint",
    "unhappy", "disappointed", "cancel", "return", "broken",
    "poor quality", "not what i ordered", "missing",
]

DELIVERY_KEYWORDS = [
    "shipped", "dispatch", "tracking", "delivered", "pickup",
    "transit", "on the way", "arrived", "package",
]

POSITIVE_KEYWORDS = [
    "thank", "perfect", "great", "love", "excellent",
    "amazing", "happy", "satisfied", "recommend",
]


def analyze_chat_transcript(messages: list[dict]) -> dict:
    """Analyze a list of chat messages for insights."""
    total = len(messages)
    if total == 0:
        return {
            "message_count": 0,
            "dispute_risk": "none",
            "delivery_mentions": 0,
            "sentiment": "neutral",
            "predictions": [],
            "flags": [],
        }

    dispute_count = 0
    delivery_count = 0
    positive_count = 0
    flags: list[str] = []
    predictions: list[str] = []

    for msg in messages:
        text = msg.get("content", "").lower()

        for kw in DISPUTE_KEYWORDS:
            if kw in text:
                dispute_count += 1
                break

        for kw in DELIVERY_KEYWORDS:
            if kw in text:
                delivery_count += 1
                break

        for kw in POSITIVE_KEYWORDS:
            if kw in text:
                positive_count += 1
                break

    dispute_ratio = dispute_count / total if total > 0 else 0
    if dispute_ratio > 0.3:
        dispute_risk = "high"
        flags.append("High dispute risk — multiple complaint-related messages detected")
    elif dispute_ratio > 0.1:
        dispute_risk = "medium"
        flags.append("Moderate dispute indicators found in conversation")
    else:
        dispute_risk = "low"

    positive_ratio = positive_count / total if total > 0 else 0
    if positive_ratio > 0.4:
        sentiment = "positive"
    elif dispute_ratio > 0.2:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    if delivery_count > 0:
        predictions.append(
            "Delivery discussion active — estimated milestone update within 24-48 hours"
        )
    if dispute_count > 2:
        predictions.append(
            "Escalation likely — recommend proactive outreach to resolve issues"
        )
    if positive_count > 3:
        predictions.append("High satisfaction — good candidate for review request")

    return {
        "message_count": total,
        "dispute_risk": dispute_risk,
        "delivery_mentions": delivery_count,
        "sentiment": sentiment,
        "predictions": predictions,
        "flags": flags,
    }


def extract_delivery_dates(text: str) -> list[str]:
    patterns = [
        r"\d{1,2}/\d{1,2}/\d{2,4}",
        r"\d{4}-\d{2}-\d{2}",
        r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{4}",
    ]
    dates = []
    for pattern in patterns:
        dates.extend(re.findall(pattern, text, re.IGNORECASE))
    return dates
