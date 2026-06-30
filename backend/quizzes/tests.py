from django.test import SimpleTestCase
from django.urls import resolve, reverse

from .views import quiz_home


class QuizUrlsTests(SimpleTestCase):
    def test_quiz_home_url_resolves(self):
        url = reverse("quiz-home")
        self.assertEqual(resolve(url).func, quiz_home)
