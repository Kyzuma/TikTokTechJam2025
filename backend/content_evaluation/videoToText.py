
from moviepy.editor import VideoFileClip
from dotenv import load_dotenv
import requests
import tempfile
import os


# Load environment variables
load_dotenv()

def downloadVideo(url):
    """
    Download video from URL and save as temporary file
    """
    try:
        # Download video from URL
        response = requests.get(url)
        response.raise_for_status()
        
        # Save to temporary file and return the path
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        temp_file.write(response.content)
        temp_file.close()

        return temp_file.name
        
    except Exception as e:
        print(f"Error downloading video: {str(e)}")
        return False

def extractAudio(video_path):
    """
    Extract audio from video file and save as WAV
    
    Args:
        video_path (str): Path to input video file
    
    Returns:
        str: Path to temporary audio file
    """
    try:
        # Load video and extract audio
        video = VideoFileClip(video_path)
        audio = video.audio

        # Create temporary file for audio
        audio_path = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name

        # Save audio file to temporary file
        audio.write_audiofile(audio_path)

        # Return audio file path
        return audio_path
        
    except Exception as e:
        print(f"Error during audio extraction: {str(e)}")
        return False

def videoToText(whisper_model, url):
    """Main function for video to audio conversion"""

    video_file = downloadVideo(url)

    # Extract audio
    audio = extractAudio(video_file)

    if not audio:
        print(f"Failed to extract audio from '{url}'")
        return
    
    # Transcribe audio file with English language specification
    result = whisper_model.transcribe(audio)  
    print("Transcription complete")

    # Get cleaned transcript
    transcript = result["text"]

    # Clean up temporary files to free memory
    os.remove(video_file)
    os.remove(audio)

    return transcript


# videoToText()