
from moviepy.editor import VideoFileClip
from dotenv import load_dotenv



# Load environment variables
load_dotenv()

def extractAudio(video_path, output_audio_path):
    """
    Extract audio from video file and save as WAV
    
    Args:
        video_path (str): Path to input video file
        output_audio_path (str): Path for output audio file
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Load video and extract audio
        video = VideoFileClip(video_path)
        audio = video.audio
        
        # Write audio to file
        audio.write_audiofile(output_audio_path)
        
        # Clean up
        audio.close()
        video.close()
        
        return True
        
    except Exception as e:
        print(f"Error during audio extraction: {str(e)}")
        return False
    


def videoToText(whisper_model):
    """Main function for video to audio conversion"""

    # Video file path - update this to your actual video file
    video_file = "video1.mp4"
    audio_file = "video1.wav"
    
    # Extract audio
    success = extractAudio(video_file, audio_file)

    if not success:
        print(f"Failed to extract audio from '{video_file}'")
        return
    print("Audio extracted")
    
    # Transcribe audio file with English language specification
    result = whisper_model.transcribe(audio_file)  
    print("Transcription complete")

    # Get cleaned transcript
    transcript = result["text"]

    return transcript


# videoToText()