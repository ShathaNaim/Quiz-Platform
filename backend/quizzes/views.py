from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Quiz, Question, Choice, Attempt, Answer, AttemptEvent
from .serializers import (QuizSerializer, QuestionSerializer, ChoiceSerializer,
 AttemptSerializer, AnswerSerializer, AttemptEventSerializer,RegisterSerializer,
 JoinQuizSerializer, JoinedQuizSerializer, StartAttemptSerializer,
 PublicQuestionSerializer, SubmitAttemptSerializer)
from django.contrib.auth.models import User
from rest_framework import status, viewsets,mixins
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import generics
import secrets
import string

def generate_unique_quiz_code():
    alphabet = string.ascii_uppercase + string.digits

    while True:
        code = "".join(secrets.choice(alphabet) for _ in range(6))
        if not Quiz.objects.filter(code=code).exists():
            return code


def get_quiz_availability_error(quiz):
    now = timezone.now()

    if quiz.status != "published":
        return "This quiz is not published."

    if quiz.available_from and now < quiz.available_from:
        return "This quiz is not available yet."

    if quiz.available_until and now > quiz.available_until:
        return "This quiz has expired."

    return None


def is_quiz_available(quiz):
    return get_quiz_availability_error(quiz) is None

TAB_SWITCH_AUTO_SUBMIT_LIMIT = 3


def submit_attempt_with_answers(attempt, answers):
    answers_by_question = {
        answer["question"]: answer["selected_choice"]
        for answer in answers
    }
    questions = attempt.quiz.questions.prefetch_related("choices").all()
    total_points = sum(question.points for question in questions)
    score = 0

    Answer.objects.filter(attempt=attempt).delete()

    for question in questions:
        selected_choice_id = answers_by_question.get(question.id)
        selected_choice = None
        is_correct = False
        points_awarded = 0

        if selected_choice_id:
            selected_choice = question.choices.filter(id=selected_choice_id).first()

        if selected_choice and selected_choice.is_correct:
            is_correct = True
            points_awarded = question.points
            score += question.points

        Answer.objects.create(
            attempt=attempt,
            question=question,
            selected_choice=selected_choice,
            is_correct=is_correct,
            points_awarded=points_awarded,
        )

    attempt.score = score
    attempt.total_points = total_points
    attempt.status = "submitted"
    attempt.submitted_at = timezone.now()
    attempt.save(update_fields=["score", "total_points", "status", "submitted_at"])


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            code=generate_unique_quiz_code(),
        )

    @action(detail=True, methods=["post"], url_path="regenerate-code")
    def regenerate_code(self, request, pk=None):
        quiz = self.get_object()
        quiz.code = generate_unique_quiz_code()
        quiz.save(update_fields=["code"])
        return Response(self.get_serializer(quiz).data)



class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Question.objects.filter(quiz__author=self.request.user)
        quiz_id = self.request.query_params.get("quiz")

        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)

        return queryset

class ChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = ChoiceSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Choice.objects.filter(question__quiz__author=self.request.user)

class AttemptViewSet(viewsets.ModelViewSet):
    queryset = Attempt.objects.all()
    serializer_class = AttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Attempt.objects.filter(
            quiz__author=self.request.user
        ).prefetch_related("events")

        quiz_id = self.request.query_params.get("quiz")

        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)

        return queryset
class AnswerViewSet(viewsets.ModelViewSet):
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Answer.objects.filter(attempt__quiz__author=self.request.user)


@api_view(["POST"])
@permission_classes([AllowAny])
def join_quiz(request):
    serializer = JoinQuizSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    code = serializer.validated_data["code"].strip().upper()
    quiz = get_object_or_404(Quiz, code=code)
    availability_error = get_quiz_availability_error(quiz)

    if availability_error:
        return Response(
            {"detail": availability_error},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(JoinedQuizSerializer(quiz).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def start_attempt(request):
    serializer = StartAttemptSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    quiz = get_object_or_404(
        Quiz,
        id=serializer.validated_data["quiz"],
        status="published",
    )
    availability_error = get_quiz_availability_error(quiz)

    if availability_error:
        return Response(
            {"detail": availability_error},
            status=status.HTTP_400_BAD_REQUEST,
        )

    participant_email = serializer.validated_data.get("participant_email", "").strip().lower()

    attempt_count = Attempt.objects.filter(
        quiz=quiz,
        participant_email__iexact=participant_email,
    ).count()

    if attempt_count >= quiz.max_attempts_per_email:
        return Response(
            {"detail": "You have reached the attempt limit for this quiz."},
            status=status.HTTP_400_BAD_REQUEST,
        )
        

    attempt = Attempt.objects.create(
        quiz=quiz,
        participant_name=serializer.validated_data["participant_name"],
        participant_email=participant_email,
        total_points=sum(question.points for question in quiz.questions.all()),
    )

    return Response(AttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def attempt_detail(request, attempt_id):
    attempt = get_object_or_404(
        Attempt.objects.select_related("quiz"),
        id=attempt_id,
        quiz__status="published",
    )

    return Response(
        {
            "id": attempt.id,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "status": attempt.status,
            "time_limit": attempt.quiz.time_limit,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def attempt_questions(request, attempt_id):
    attempt = get_object_or_404(
        Attempt.objects.select_related("quiz"),
        id=attempt_id,
        status="in_progress",
        quiz__status="published",
    )
    questions = attempt.quiz.questions.prefetch_related("choices").order_by("order", "id")

    return Response(PublicQuestionSerializer(questions, many=True).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_attempt(request, attempt_id):
    attempt = get_object_or_404(
        Attempt.objects.select_related("quiz"),
        id=attempt_id,
        status="in_progress",
        quiz__status="published",
    )
    serializer = SubmitAttemptSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    submit_attempt_with_answers(attempt, serializer.validated_data["answers"])

    response_data = {
        "attempt": attempt.id,
        "status": attempt.status,
        "show_result_to_student": attempt.quiz.show_result_to_student,
        "submitted_automatically": False,
    }

    if attempt.quiz.show_result_to_student:
        response_data["score"] = attempt.score
        response_data["total_points"] = attempt.total_points

    return Response(response_data)

class AttemptEventViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = AttemptEventSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        attempt = event.attempt

        tab_switch_count = attempt.events.filter(event_type="tab_switch").count()
        page_refresh_count = attempt.events.filter(event_type="page_refresh").count()
        fullscreen_exit_count = attempt.events.filter(event_type="fullscreen_exit").count()
        total_event_count = attempt.events.filter(
                event_type__in=["tab_switch", "page_refresh", "fullscreen_exit"]
            ).count()

        should_auto_submit = (
                total_event_count >= 3
                and attempt.status == "in_progress"
            )

        if should_auto_submit:
            answers = request.data.get("answers", [])

            if not isinstance(answers, list):
                answers = []

            submit_attempt_with_answers(attempt, answers)

        headers = self.get_success_headers(serializer.data)

        return Response(
            {
                **serializer.data,
                "tab_switch_count": tab_switch_count,
                "page_refresh_count": page_refresh_count,
                "fullscreen_exit_count": fullscreen_exit_count,
                "should_auto_submit": should_auto_submit,
                "attempt_status": attempt.status,
                "show_result_to_student": attempt.quiz.show_result_to_student,
                "score": attempt.score,
                "total_points": attempt.total_points,
                "submitted_automatically": should_auto_submit,
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated:
            return AttemptEvent.objects.filter(
                attempt__quiz__author=user
            ).select_related("attempt", "attempt__quiz")

        return AttemptEvent.objects.none()
