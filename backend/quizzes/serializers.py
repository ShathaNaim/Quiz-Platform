from rest_framework import serializers
from .models import Quiz, Question, Choice, Attempt, Answer,AttemptEvent
from django.contrib.auth.models import User


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = '__all__'
        read_only_fields = ['author', 'code']

        
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct", "question"]

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "quiz", "text", "points", "order", "choices"]


class PublicChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text"]


class PublicQuestionSerializer(serializers.ModelSerializer):
    choices = PublicChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "points", "order", "choices"]


class JoinQuizSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=10)


class JoinedQuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ["id", "title", "description", "time_limit", "code", "show_result_to_student"]


class StartAttemptSerializer(serializers.Serializer):
    quiz = serializers.IntegerField()
    participant_name = serializers.CharField(max_length=255)
    participant_email = serializers.EmailField(required=True, allow_blank=True)


class SubmitAttemptAnswerSerializer(serializers.Serializer):
    question = serializers.IntegerField()
    selected_choice = serializers.IntegerField()


class SubmitAttemptSerializer(serializers.Serializer):
    answers = SubmitAttemptAnswerSerializer(many=True)



class AttemptSerializer(serializers.ModelSerializer):
    tab_switch_count = serializers.SerializerMethodField()
    page_refresh_count = serializers.SerializerMethodField()
    fullscreen_exit_count = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = '__all__'

    def get_tab_switch_count(self, obj):
        return obj.events.filter(event_type="tab_switch").count()

    def get_page_refresh_count(self, obj):
        return obj.events.filter(event_type="page_refresh").count()

    def get_fullscreen_exit_count(self, obj):
        return obj.events.filter(event_type="fullscreen_exit").count()

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = '__all__'



class AttemptEventSerializer(serializers.ModelSerializer):
    tab_switch_count = serializers.SerializerMethodField()
    page_refresh_count = serializers.SerializerMethodField()
    fullscreen_exit_count = serializers.SerializerMethodField()
    class Meta:
        model = AttemptEvent
        fields = ["id", "attempt", "event_type", "created_at", "tab_switch_count", "page_refresh_count", "fullscreen_exit_count"]
        read_only_fields = ["id", "created_at"]

    def validate(self, data):
        attempt = data.get("attempt")

        if attempt.status != "in_progress":
            raise serializers.ValidationError("This attempt is not active.")

        return data

    def get_tab_switch_count(self, obj):
        return obj.attempt.events.filter(event_type="tab_switch").count()

    def get_page_refresh_count(self, obj):
        return obj.attempt.events.filter(event_type="page_refresh").count()

    def get_fullscreen_exit_count(self, obj):
        return obj.attempt.events.filter(event_type="fullscreen_exit").count()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )
        return user
