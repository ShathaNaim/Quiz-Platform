from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Quiz(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    time_limit = models.PositiveIntegerField(help_text="Time limit in minutes", null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=10, unique=True, null=True, blank=True)
    status = models.CharField(max_length=10, choices=[('draft', 'Draft'), ('published', 'Published'),('closed', 'Closed')], 
    default='draft')
    show_result_to_student = models.BooleanField(default=True)
    available_from = models.DateTimeField(null=True, blank=True)
    available_until = models.DateTimeField(null=True, blank=True)
    max_attempts_per_email = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.title


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.text

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text

class Attempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")

    participant_name = models.CharField(max_length=255)
    participant_email = models.EmailField()


    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ("in_progress", "In Progress"),
            ("submitted", "Submitted"),
            ("expired", "Expired"),
        ],
        default="in_progress",
    )

    score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_points = models.PositiveIntegerField(default=0)

class Answer(models.Model):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(
        Choice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    is_correct = models.BooleanField(default=False)
    points_awarded = models.DecimalField(max_digits=5, decimal_places=2, default=0)

class AttemptEvent(models.Model):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)