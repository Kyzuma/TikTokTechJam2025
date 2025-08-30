import torch
from langchain.prompts import PromptTemplate

def llmScoring(transcript, gemini_model):
    """
    Evaluate text for hate speech and mental health indicators using Gemini
    
    Args:
        transcript (str): The text to evaluate
    
    Returns:
        float: The final score (0.0 to 1.0)
    """
    try:
        # Create prompt template with instructions
        prompt_template = PromptTemplate(
            input_variables=["transcript"],
            template="""You are a content moderation AI. Analyze this text for hate speech and mental health concerns.

                Text: {transcript}

                Respond with ONLY two scores in this exact format:
                Hate: [0.0-1.0]
                Mental Health: [0.0-1.0]

                Scores:"""
                        )
        
        # Create the full prompt
        full_prompt = prompt_template.format(transcript=transcript)
        
        # Run the model with the formatted prompt
        response = gemini_model.invoke(full_prompt)
        
        # Parse the response to extract scores
        try:
            response_text = response.content.strip()
            lines = response_text.split('\n')
            hate_score = 0.0
            mh_score = 0.0
            
            # Parse each line
            for line in lines:
                line = line.strip()
                if line.startswith('Hate:'):
                    score_part = line.split('Hate:')[1].strip()
                    hate_score = float(score_part)
                elif line.startswith('Mental Health:'):
                    score_part = line.split('Mental Health:')[1].strip()
                    mh_score = float(score_part)
            
            # Return both scores separately (don't average them)
            return {"hate": hate_score, "mental_health": mh_score}
            
        except (ValueError, IndexError) as e:
            print(f"Could not parse LLM response: {response.content}")
            print(f"Error: {e}")
            return {"hate": 0.5, "mental_health": 0.5}
        
    except Exception as e:
        print(f"Error during LLM scoring: {str(e)}")
        return {"hate": 0.5, "mental_health": 0.5}

def getLabelsScores(transcript, filter_model, filter_tokenizer, gemini_model, hate_weight=0.7, mh_weight=0.3):
    """
    Get hate and mental health scores from transcript using hybrid approach
    
    Args:
        transcript (str): The text to analyze
        hate_weight (float): Weight for hate speech detection (default: 0.7)
        mh_weight (float): Weight for mental health detection (default: 0.3)
    
    Returns:
        float: Combined weighted score
    """
    try:
        # Load adapters
        filter_model.load_adapter("./hate_adapter", load_as="hate_task")
        filter_model.load_adapter("./mh_adapter", load_as="mh_task")

        # Get Hate Score
        filter_model.set_active_adapters("hate_task")
        inputs = filter_tokenizer(transcript, return_tensors="pt")

        with torch.no_grad():
            outputs = filter_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)

        # Check confidence for all labels
        all_confidences = probs[0].tolist()

        # If confidence for all labels under 0.5, use LLM
        if all(confidence < 0.5 for confidence in all_confidences):
            llm_scores = llmScoring(transcript, gemini_model)
            hate_score = llm_scores["hate"] * hate_weight
        else:
            # Use adapter confidence for hate label (0)
            print(all_confidences)
            print(probs[0, 0].item())
            hate_score = probs[0, 0].item() * hate_weight
            print(hate_score)

        # Get Mental Health Score
        filter_model.set_active_adapters("mh_task")
        inputs = filter_tokenizer(transcript, return_tensors="pt")

        with torch.no_grad():
            outputs = filter_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)

        all_confidences = probs[0].tolist() 

        if all(confidence < 0.5 for confidence in all_confidences):
            llm_scores = llmScoring(transcript, gemini_model)
            mh_score = llm_scores["mental_health"] * mh_weight
        else:
            # Use adapter confidence for mental health label (2)
            mh_score = probs[0, 2].item() * mh_weight
    
        # Deactivate adapters
        filter_model.set_active_adapters(None)
        
        # Calculate weighted final score (weights sum to 1.0, so this is correct)
        final_score = hate_score + mh_score
        print(f"Hate score: {hate_score:.3f}, MH score: {mh_score:.3f}, Final score: {final_score:.3f}")
        
        return final_score
    
    except Exception as e:
        print(f"Error during label extraction: {str(e)}")
        llm_scores = llmScoring(transcript, gemini_model)
        return llm_scores["hate"] * hate_weight + llm_scores["mental_health"] * mh_weight
    

# def databaseUpload(data):
#     """
#     Upload data to database
#     """

#     # Create supabase client
#     supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_KEY'))

#     # Upload data to database
#     supabase.table('videos').insert(data).execute()

#     pass