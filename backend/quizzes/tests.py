from django.test import SimpleTestCase
from django.urls import resolve, reverse

from .views import attempt_questions, join_quiz, start_attempt, submit_attempt


class QuizUrlsTests(SimpleTestCase):
    def test_join_quiz_url_resolves(self):
        url = reverse("join-quiz")
        self.assertEqual(resolve(url).func, join_quiz)

    def test_start_attempt_url_resolves(self):
        url = reverse("start-attempt")
        self.assertEqual(resolve(url).func, start_attempt)

    def test_attempt_questions_url_resolves(self):
        url = reverse("attempt-questions", kwargs={"attempt_id": 1})
        self.assertEqual(resolve(url).func, attempt_questions)

    def test_submit_attempt_url_resolves(self):
        url = reverse("submit-attempt", kwargs={"attempt_id": 1})
        self.assertEqual(resolve(url).func, submit_attempt)
