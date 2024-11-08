import React, { useState, useEffect } from "react";
import { db } from "../../base/firebase";
import { ref, onValue, update, get } from "firebase/database";

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
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [ranking, setRanking] = useState([]); // Состояние для рейтинга
  const [showRankingScreen, setShowRankingScreen] = useState(false); // Показ экрана рейтинга

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
        if (data) {
          const sortedRanking = Object.entries(data)
            .map(([name, info]) => ({ name, score: info.score || 0 }))
            .sort((a, b) => b.score - a.score);
          setRanking(sortedRanking);
        }
      });

      const sessionStatusRef = ref(db, `sessions/${sessionCode}/isActive`);
      onValue(sessionStatusRef, (snapshot) => {
        setSessionStarted(snapshot.val() || false);
      });
    }
  }, [sessionCode]);

  useEffect(() => {
    if (
      sessionStarted &&
      currentQuestionIndex < questions.length &&
      !showRankingScreen
    ) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            // Показать таблицу на 10 секунд вместо следующего вопроса
            setShowRankingScreen(true);
            clearInterval(countdown);
            return 25;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [
    sessionStarted,
    currentQuestionIndex,
    questions.length,
    answerSubmitted,
    showRankingScreen,
  ]);

  useEffect(() => {
    if (showRankingScreen) {
      const rankingTimeout = setTimeout(() => {
        setShowRankingScreen(false); // Скрыть таблицу после 10 секунд и перейти к следующему вопросу
        handleNextQuestion();
      }, 10000);
      return () => clearTimeout(rankingTimeout);
    }
  }, [showRankingScreen]);

  const joinSession = async () => {
    if (sessionCode && playerName) {
      const sessionRef = ref(db, `sessions/${sessionCode}`);
      const sessionSnapshot = await get(sessionRef);

      if (sessionSnapshot.exists()) {
        const participantRef = ref(
          db,
          `sessions/${sessionCode}/participants/${playerName}`
        );
        update(participantRef, { score: 0 });
        setJoined(true);
        setError("");
      } else {
        setError("Session does not exist.");
      }
    }
  };

  const submitAnswer = async () => {
    if (!answerSubmitted) {
      const correctAnswer = questions[currentQuestionIndex].correctAnswer;

      // Проверяем, что выбранный ответ соответствует правильному
      if (selectedAnswer === correctAnswer) {
        const newScore = score + 3; // Вычисляем новый счёт локально
        setScore(newScore); // Обновляем состояние (это асинхронно)

        // Обновляем счёт в базе данных, сразу используя newScore
        const participantRef = ref(
          db,
          `sessions/${sessionCode}/participants/${playerName}`
        );
        await update(participantRef, { score: newScore }); // Обновляем с новым значением

        console.log("Score updated in database:", newScore); // Для отладки
      }
      setAnswerSubmitted(true);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setTimer(25);
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
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <div>
          {!sessionStarted ? (
            <div>
              <p>Waiting for the session to start...</p>
              <p>Participants: {participantsCount}</p>
            </div>
          ) : currentQuestionIndex < questions.length ? (
            showRankingScreen ? (
              // Экран рейтинга
              <div>
                <h3>Leaderboard</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((participant, idx) => (
                      <tr key={idx}>
                        <td>{participant.name}</td>
                        <td>{participant.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>Next question will appear shortly...</p>
              </div>
            ) : (
              // Экран вопроса
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
            )
          ) : (
            // Финальная таблица рейтинга после завершения всех вопросов
            <div>
              <div>Quiz Finished! Your score: {score}</div>
              <div>
                <h3>Final Leaderboard</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((participant, idx) => (
                      <tr key={idx}>
                        <td>{participant.name}</td>
                        <td>{participant.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PublicSession;
