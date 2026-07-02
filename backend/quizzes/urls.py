from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    QuizViewSet,
    QuestionViewSet,
    ChoiceViewSet,
    AttemptViewSet,
    AnswerViewSet,
    AttemptEventViewSet,
    join_quiz,
    start_attempt,
    attempt_detail,
    attempt_questions,
    submit_attempt,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


router = DefaultRouter()
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'choices', ChoiceViewSet, basename='choice')
router.register(r'attempts', AttemptViewSet, basename='attempt')
router.register(r'answers', AnswerViewSet, basename='answer')
router.register(r'attempt-events', AttemptEventViewSet, basename='attempt-event')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('join-quiz/', join_quiz, name='join-quiz'),
    path('attempts/start/', start_attempt, name='start-attempt'),
    path('attempts/<int:attempt_id>/', attempt_detail, name='attempt-detail'),
    path('attempts/<int:attempt_id>/questions/', attempt_questions, name='attempt-questions'),
    path('attempts/<int:attempt_id>/submit/', submit_attempt, name='submit-attempt'),
    path('', include(router.urls)),
]
