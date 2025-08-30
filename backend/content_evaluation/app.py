from flask import Flask, request, jsonify
import os
from datetime import datetime
from videoToText import videoToText
from hateMentalPipeline import getLabelsScores
from clickbaitPipeline import clickBait
import whisper
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from transformers import AutoTokenizer
from adapters import AutoAdapterModel

whisper_model = whisper.load_model("base")  

# Load HateBERT model
filter_model = AutoAdapterModel.from_pretrained("GroNLP/hateBERT", local_files_only=True)
filter_tokenizer = AutoTokenizer.from_pretrained("GroNLP/hateBERT", local_files_only=True)

# Load environment variables
load_dotenv()

# Initialize Gemini model
gemini = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.4,
    max_output_tokens=200,
    convert_system_message_to_human=True
)

# Initialize Flask app
app = Flask(__name__)

# Routes
@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
    })
@app.route('/checkContent', methods=['GET'])
def checkContent():
    """ML prediction endpoint"""
    try:
        # data = request.get_json()
        # if not data:
        #     return jsonify({'error': 'No data provided'}), 400
        
        # Get transcript
        transcript = videoToText(whisper_model)

        # Get labels and scores
        hate_mh_score = getLabelsScores(transcript, filter_model, filter_tokenizer, gemini)

        # Get click bait score
        click_bait = clickBait(gemini, transcript)

        # Final quality score with weights
        final_score = (1 - (hate_mh_score * 0.8 + click_bait * 0.2)) * 100
        final_score = round(final_score, 1)

        # Give a summary of the transcript, the score and the reasoning to throw into gemini
        summary = f"""
        You are a content moderation AI. These are my results from analyzing a video transcript using my hate speech and mental health detection model and my click bait llm model.
        Transcript: {transcript}\n Hate Speech and Mental Health Score (Higher means flagged): {hate_mh_score}\n Click Bait Score (Higher means flagged): {click_bait}\n Quality Score (Higher means better): {final_score}\n Good Quality: {final_score > 50}
        
        Review the transcript and the scores and give a short explaination (Under 50 words) of the scores and the reasoning for the score. 
        Focus on important keywords in the transcript that results in the low score from hate speech, mental health detection and click bait detection.
        """
        gemini_summary = gemini.invoke(summary)

        # Check if score is greater than 50
        if final_score < 50:
            print("Transcript is not safe")
            return {
                'message': 'Quality score is low',
                'score': final_score,
                'summary': gemini_summary.content
            }
        else:
            print("Transcript is safe")
            return {
                'message': 'Quality score is high',
                'score': final_score,
                'summary': gemini_summary.content
            }
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/flagged', methods=['POST'])
def flagged():
    """Flagged endpoint added to supabase pgvector table"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Add data to supabase pgvector table
        # add_to_supabase(data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({
        'message': 'Flagged endpoint'
    })

if __name__ == '__main__':
    # Run the app in debug mode for development
    app.run(debug=True, host='0.0.0.0', port=5000)
