from django.contrib import admin
from .models import Quiz, Question, Choice, Attempt, Answer, AttemptEvent
# Register your models here.
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Choice)
admin.site.register(Attempt)
admin.site.register(Answer)
admin.site.register(AttemptEvent)