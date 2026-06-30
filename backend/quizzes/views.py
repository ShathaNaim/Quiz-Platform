from django.shortcuts import render
from .models import Quiz, Question, Choice, Attempt, Answer, AttemptEvent
from .serializers import (QuizSerializer, QuestionSerializer, ChoiceSerializer,
 AttemptSerializer, AnswerSerializer, AttemptEventSerializer,RegisterSerializer)
from django.contrib.auth.models import User
from rest_framework import viewsets,mixins
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer

class AttemptViewSet(viewsets.ModelViewSet):
    queryset = Attempt.objects.all()
    serializer_class = AttemptSerializer

    def get_queryset(self):
        return Attempt.objects.filter(
            quiz__teacher=self.request.user
        ).prefetch_related("events")

class AnswerViewSet(viewsets.ModelViewSet):
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer

class AttemptEventViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = AttemptEventSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated:
            return AttemptEvent.objects.filter(
                attempt__quiz__teacher=user
            ).select_related("attempt", "attempt__quiz")

        return AttemptEvent.objects.none()