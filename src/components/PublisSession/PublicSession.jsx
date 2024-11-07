import React, { useState, useEffect } from "react";
import { db } from "../../base/firebase";
import { ref, onValue, update } from "firebase/database";

function PublicSession() {
  const [playerName, setPlayerName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(25);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false); // Новый флаг

  useEffect(() => {
    if (sessionCode) {
      const questionsRef = ref(db, `sessions/${sessionCode}/questions`);
      onValue(questionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setQuestions(Object.values(data));
      });

      const participantsRef = ref(db, `sessions/${sessionCode}/participants`);
      onValue(participantsRef, (snapshot) => {
        const data = snapshot.val();
        setParticipantsCount(data ? Object.keys(data).length : 0);
      });

      const sessionStatusRef = ref(db, `sessions/${sessionCode}/isActive`);
      onValue(sessionStatusRef, (snapshot) => {
        setSessionStarted(snapshot.val() || false);
      });
    }
  }, [sessionCode]);

  useEffect(() => {
    if (sessionStarted && currentQuestionIndex < questions.length) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            // Таймер истек: переходим к следующему вопросу
            handleNextQuestion();
            clearInterval(countdown);
            return 25; // Сброс таймера для следующего вопроса
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [sessionStarted, currentQuestionIndex, questions.length, answerSubmitted]);

  const joinSession = () => {
    if (sessionCode && playerName) {
      const participantRef = ref(
        db,
        `sessions/${sessionCode}/participants/${playerName}`
      );
      update(participantRef, { score: 0 });
      setJoined(true);
    }
  };

  const submitAnswer = () => {
    if (!answerSubmitted) {
      const correctAnswer = questions[currentQuestionIndex].correctAnswer;
      if (selectedAnswer === correctAnswer) {
        setScore((prev) => prev + 1);
        const participantRef = ref(
          db,
          `sessions/${sessionCode}/participants/${playerName}`
        );
        update(participantRef, { score: score + 1 });
      }
      setAnswerSubmitted(true); // Фиксируем ответ
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setAnswerSubmitted(false); // Сбрасываем флаг ответа
    setTimer(25); // Сброс таймера для следующего вопроса
  };

  return (
    <div>
      {!joined ? (
        <div>
          <input
            type="text"
            placeholder="Your name"
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Session Code"
            onChange={(e) => setSessionCode(e.target.value)}
          />
          <button onClick={joinSession}>Join Session</button>
        </div>
      ) : (
        <div>
          {!sessionStarted ? (
            <div>
              <p>Waiting for the session to start...</p>
              <p>Participants: {participantsCount}</p>
            </div>
          ) : currentQuestionIndex < questions.length ? (
            <div>
              <div>Question: {questions[currentQuestionIndex].question}</div>
              {questions[currentQuestionIndex].answers.map((answer, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(answer)}
                  style={{
                    backgroundColor:
                      selectedAnswer === answer ? "lightblue" : "white",
                  }}
                >
                  {answer}
                </button>
              ))}
              <p>Time remaining: {timer} seconds</p>
              <button onClick={submitAnswer} disabled={answerSubmitted}>
                Submit Answer
              </button>
            </div>
          ) : (
            <div>Quiz Finished! Your score: {score}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default PublicSession;
