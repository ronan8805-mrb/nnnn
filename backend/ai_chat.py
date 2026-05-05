"""
AI Chat Service for Garda Emergency Response
Uses local knowledge base to provide consistent, rapid responses without external API dependencies.
"""
import json
import os
import random
from typing import Dict, List, Union

# Load knowledge base
# resolving path relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, '..', 'assets')
KNOWLEDGE_FILE = os.path.join(ASSETS_DIR, 'garda-ai-knowledge.json')

def load_knowledge_base() -> Dict:
    """Load the shared knowledge base JSON file"""
    try:
        if os.path.exists(KNOWLEDGE_FILE):
            with open(KNOWLEDGE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"Loaded knowledge base with {len(data.get('intents', {}))} intents")
                return data
        else:
            print(f"Knowledge base file not found at: {KNOWLEDGE_FILE}")
            return {"intents": {}, "DEFAULT": ["I am here to help. Please tell me more."]}
    except Exception as e:
        print(f"Error loading knowledge base: {e}")
        return {"intents": {}, "DEFAULT": ["I am here to help. Please tell me more."]}

# Initialize knowledge base
KNOWLEDGE_BASE = load_knowledge_base()

def get_garda_response(user_message: str, context: dict = None) -> str:
    """
    Generate a response based on local knowledge base.
    
    Args:
        user_message: The user's message
        context: Optional context dictionary (location, etc.) - kept for API compatibility
        
    Returns:
        Selected response string
    """
    if not user_message:
        return "I'm listening. How can I help?"

    user_message = user_message.lower()
    detected_intent = "DEFAULT"
    
    # reload if empty (in case of startup error that is fixed)
    global KNOWLEDGE_BASE
    if not KNOWLEDGE_BASE.get('intents'):
        KNOWLEDGE_BASE = load_knowledge_base()

    # 1. Check for exact intent matches based on keywords
    # We iterate through intents to find the first matching keyword
    # Priority could be improved by ordering intents in JSON, but simple iteration works for now
    intents = KNOWLEDGE_BASE.get("intents", {})
    
    # specific overrides for high priority keywords
    if any(x in user_message for x in ['suicide', 'kill myself', 'end it']):
        detected_intent = 'SUICIDE'
    elif any(x in user_message for x in ['rape', 'sexual']):
        detected_intent = 'SEXUAL_ASSAULT'
    elif any(x in user_message for x in ['fire', 'smoke']):
        detected_intent = 'FIRE'
    elif any(x in user_message for x in ['gun', 'knife', 'weapon']):
        detected_intent = 'WEAPONS'
    else:
        # General search
        for intent, keywords in intents.items():
            for keyword in keywords:
                # Simple substring match
                # Add spaces to avoid partial word matches if needed, but simple match is more robust for typos
                if keyword in user_message:
                    detected_intent = intent
                    break
            if detected_intent != "DEFAULT":
                break
            
    print(f"AI Chat: Message='{user_message}' -> Intent='{detected_intent}'")
    
    # 2. Get responses for the detected intent
    # The JSON structure has a "responses" key containing the mapping
    responses_dict = KNOWLEDGE_BASE.get("responses", {})
    responses = responses_dict.get(detected_intent)
    
    # Fallback if intent found but no responses (shouldn't happen with valid JSON)
    if not responses:
        responses = responses_dict.get("DEFAULT", ["I am here to help. Please tell me more."])
    
    # 3. Select a random response
    if isinstance(responses, list):
        return random.choice(responses)
    
    return responses

# For backward compatibility if imported elsewhere
get_fallback_response = get_garda_response
