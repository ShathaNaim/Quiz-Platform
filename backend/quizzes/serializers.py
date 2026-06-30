from rest_framework import serializers
from .models import Quiz, Question, Choice, Attempt, Answer,AttemptEvent
from django.contrib.auth.models import User


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = '__all__'
        read_only_fields = ['author']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = '__all__'

class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attempt
        fields = '__all__'

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
        return obj.events.filter(event_type="tab_switch").count()

    def get_page_refresh_count(self, obj):
        return obj.events.filter(event_type="page_refresh").count()

    def get_fullscreen_exit_count(self, obj):
        return obj.events.filter(event_type="fullscreen_exit").count()


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
