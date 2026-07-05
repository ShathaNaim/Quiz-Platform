# Quiz Platform

Quiz Platform is a web application for creating, publishing, joining, and taking quizzes.

Teachers or quiz authors can create quizzes, add questions and choices, control quiz availability, set attempt limits, and review submitted attempts. Students can join a published quiz using a quiz code and submit their answers from any device.

## Main Features

- User sign up and sign in
- Create, edit, publish, close, and delete quizzes
- Backend-generated unique quiz codes
- Regenerate quiz codes when needed
- Add, edit, and delete quiz questions
- Set time limits and quiz availability windows
- Limit attempts per participant email
- Join quizzes by code
- Track quiz attempts and submitted answers
- Show attempt statistics and score distribution charts
- Optional student result visibility
- Basic anti-cheating event tracking for tab switches, refreshes, and fullscreen exits

## Project Structure

- `backend`: Django REST API for authentication, quizzes, questions, attempts, answers, and availability rules
- `frontend`: Next.js app for the user interface


