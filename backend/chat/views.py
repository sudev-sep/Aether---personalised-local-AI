from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .services import OllamaService
from .models import Conversation, Message, UserMemory

class LocalAIQueryView(APIView):
    def post(self, request):
        user_prompt = request.data.get("prompt")
        conversation_id = request.data.get("conversation_id")

        if not user_prompt:
            return Response({"error": "Prompt is required."}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        default_user = User.objects.first()
        if not default_user:
            return Response({"error": "No users found in database."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Quick command to save a permanent memory (zero extra LLM latency)
        if user_prompt.lower().startswith("/remember "):
            fact = user_prompt[10:].strip()
            if fact:
                UserMemory.objects.create(user=default_user, fact=fact)
                return Response({
                    "conversation_id": conversation_id,
                    "response": f"Saved to long-term memory: \"{fact}\""
                }, status=status.HTTP_200_OK)

        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            conversation = Conversation.objects.create(user=default_user, title=user_prompt[:32])

        # 1. Build System Prompt from saved UserMemory facts
        # 1. Build System Prompt from saved UserMemory facts
        memories = list(UserMemory.objects.filter(user=default_user).values_list("fact", flat=True))
        system_content = "You are Aether AI, a helpful local assistant."
        if memories:
            memory_block = "\n".join(f"- {m}" for m in memories)
            system_content += (
                f"\n\nIMPORTANT USER MEMORY:\n{memory_block}\n\n"
                "Always use these saved facts when answering questions about the user. "
                "Do not claim you lack memory if the answer is in the list above."
            )

        messages_payload = [{"role": "system", "content": system_content}]
        print("DEBUG PAYLOAD:", messages_payload)  # Verify in Django terminal

        # 2. Append previous messages from the current conversation (last 10 for speed)
        past_messages = conversation.messages.all().order_by("created_at")
        for msg in past_messages:
            messages_payload.append({"role": msg.role, "content": msg.content})

        # 3. Append the new user prompt
        messages_payload.append({"role": "user", "content": user_prompt})

        # 4. Call Ollama /api/chat
        ollama = OllamaService()
        try:
            ai_response = ollama.generate_chat_response(messages_payload)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 5. Save both messages to SQLite
        Message.objects.create(conversation=conversation, role="user", content=user_prompt)
        Message.objects.create(conversation=conversation, role="assistant", content=ai_response)

        return Response({
            "conversation_id": conversation.id,
            "response": ai_response
        }, status=status.HTTP_200_OK)
        
from django.views.generic import TemplateView

class ChatHomeView(TemplateView):
    template_name = "chat/index.html"
    
    
    
    
    
class ConversationListView(APIView):
    def get(self, request):
        # Grab all conversations, newest first
        conversations = Conversation.objects.all().order_by('-created_at')
        data = []
        for conv in conversations:
            first_msg = conv.messages.first()
            title = conv.title or (first_msg.content[:32] if first_msg else f"Session #{conv.id}")
            data.append({
                "id": conv.id,
                "title": title,
                "created_at": conv.created_at
            })
        return Response(data, status=status.HTTP_200_OK)


class ConversationDetailView(APIView):
    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        messages = conversation.messages.all().values("content", "role")
        return Response(list(messages), status=status.HTTP_200_OK)
    
    
class MemoryListCreateView(APIView):
    def get(self, request):
        User = get_user_model()
        default_user = User.objects.first()
        if not default_user:
            return Response([], status=status.HTTP_200_OK)

        memories = UserMemory.objects.filter(user=default_user).order_by("-created_at").values("id", "fact", "created_at")
        return Response(list(memories), status=status.HTTP_200_OK)

    def post(self, request):
        fact = (request.data.get("fact") or "").strip()
        if not fact:
            return Response({"error": "Fact cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        default_user = User.objects.first()
        if not default_user:
            return Response({"error": "No users found."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        memory = UserMemory.objects.create(user=default_user, fact=fact)
        return Response(
            {"id": memory.id, "fact": memory.fact, "created_at": memory.created_at},
            status=status.HTTP_201_CREATED
        )


class MemoryDetailView(APIView):
    def delete(self, request, memory_id):
        try:
            memory = UserMemory.objects.get(id=memory_id)
        except UserMemory.DoesNotExist:
            return Response({"error": "Memory not found."}, status=status.HTTP_404_NOT_FOUND)

        memory.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)