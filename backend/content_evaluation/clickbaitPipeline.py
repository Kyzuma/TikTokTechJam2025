from langchain.prompts import PromptTemplate

def clickBait(model, transcript):  
    """
    Check if the transcript is click bait
    """

    prompt_template = PromptTemplate(
        input_variables=["transcript"],
        template="""You are a content moderation AI. Analyze this text for click bait taking into account of common click bait phrases and strategies.

                Text: {transcript}

                Respond with ONLY one score in this exact format (Lower score means less click bait):
                Score: [0.0-1.0]
                """)
    
    full_prompt = prompt_template.format(transcript=transcript)
    
    response = model.invoke(full_prompt)

    # Parse the response to extract score
    score = float(response.content.strip().split(':')[1].strip())
    print(f"Click bait score: {score}")
    return score
    
