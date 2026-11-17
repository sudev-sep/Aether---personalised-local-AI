from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .services import OllamaService
from .models import Conversation, Message

class LocalAIQueryView(APIView):
    def post(self, request):
        user_prompt = request.data.get("prompt")
        conversation_id = request.data.get("conversation_id")

        # 1. Validate prompt first
        if not user_prompt:
            return Response({"error": "Prompt is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Grab a default user to satisfy the foreign key requirement
        User = get_user_model()
        default_user = User.objects.first()
        
        if not default_user:
            return Response({"error": "No users found in database. Please create a superuser first."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. Retrieve existing conversation or create a new one properly
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Create new conversation and assign the user!
            conversation = Conversation.objects.create(user=default_user)

        # 4. Call Ollama service
        ollama = OllamaService()
        try:
            ai_response = ollama.generate_response(user_prompt)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 5. Save both messages to database
        Message.objects.create(conversation=conversation, content="user", role=user_prompt)
        Message.objects.create(conversation=conversation, content="assistant", role=ai_response)

        return Response({
            "conversation_id": conversation.id,
            "response": ai_response
        }, status=status.HTTP_200_OK)