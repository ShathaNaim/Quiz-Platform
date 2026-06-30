from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, QuizViewSet, QuestionViewSet, ChoiceViewSet, AttemptViewSet, AnswerViewSet, AttemptEventViewSet
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
    path('', include(router.urls)),
]