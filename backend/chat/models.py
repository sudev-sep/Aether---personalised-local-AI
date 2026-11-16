from django.conf import settings
from django.db import models

class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title if self.title else f"Conversation {self.id}"  
    

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    created_at =models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    role = models.CharField(max_length=10, choices=[('user', 'User'), ('assistant', 'Assistant')])
    
    class Meta:
        ordering = ['created_at']
        
    def __str__(self):
        return f"{self.role.capitalize()} message in Conversation {self.conversation.id} at {self.created_at}"