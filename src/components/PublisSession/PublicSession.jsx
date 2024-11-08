import React, { useState, useEffect } from "react";
import { db } from "../../base/firebase";
import { ref, onValue, update, get } from "firebase/database";
import { Input, Table } from "antd"; // Импортируем Table из Ant Design
import classes from "./publicSession.module.scss";

function PublicSession() {
  const [playerName, setPlayerName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(25);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [ranking, setRanking] = useState([]);
  const [showRankingScreen, setShowRankingScreen] = useState(false);

  const columns = [
    {
      title: "Place",
      dataIndex: "place",
      key: "place",
      render: (text) => `#${text}`, // Форматирование места (например, #1, #2)
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
    },
  ];

  useEffect(() => {
    if (sessionCode) {
      const sessionRef = ref(db, `sessions/${sessionCode}`);
      onValue(sessionRef, (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setSessionStarted(data.isActive || false);
          setParticipantsCount(Object.keys(data.participants || {}).length);

          if (data.questions && Object.keys(data.questions).length > 0) {
            setQuestions(Object.values(data.questions));
          } else {
            const generalQuestionsRef = ref(db, `questions`);
            onValue(generalQuestionsRef, (questionsSnapshot) => {
              const questionsData = questionsSnapshot.val();
              if (questionsData) {
                setQuestions(Object.values(questionsData));
              }
            });
          }

          if (
            data.currentQuestionIndex !== undefined &&
            data.currentQuestionIndex !== currentQuestionIndex
          ) {
            setCurrentQuestionIndex(data.currentQuestionIndex);
          }

          // Создаем рейтинг с местами
          const sortedRanking = Object.entries(data.participants || {})
            .map(([name, info]) => ({ name, score: info.score || 0 }))
            .sort((a, b) => b.score - a.score)
            .map((participant, index) => ({
              ...participant,
              place: index + 1, // Присваиваем место участнику
            }));

          setRanking(sortedRanking);
        } else {
          setError("Session does not exist.");
        }
      });
    }
  }, [sessionCode, currentQuestionIndex]);

  useEffect(() => {
    if (
      sessionStarted &&
      currentQuestionIndex < questions.length &&
      !showRankingScreen
    ) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
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
        setShowRankingScreen(false);
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

  const submitAnswer = () => {
    if (!answerSubmitted && selectedAnswerIndex !== null) {
      const correctAnswerIndex = questions[currentQuestionIndex].correctAnswer;

      if (selectedAnswerIndex === correctAnswerIndex) {
        const newScore = score + 3;
        setScore(newScore);

        const participantRef = ref(
          db,
          `sessions/${sessionCode}/participants/${playerName}`
        );

        update(participantRef, {
          score: newScore,
          selectedAnswerIndex: selectedAnswerIndex,
        })
          .then(() => {
            console.log("Score and selected answer updated in DB");
          })
          .catch((error) => {
            console.error("Error updating score and answer in DB:", error);
          });
      } else {
        const participantRef = ref(
          db,
          `sessions/${sessionCode}/participants/${playerName}`
        );
        update(participantRef, { selectedAnswerIndex: selectedAnswerIndex })
          .then(() => {
            console.log("Incorrect answer recorded in DB");
          })
          .catch((error) => {
            console.error("Error updating answer in DB:", error);
          });
      }

      setAnswerSubmitted(true);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      setSelectedAnswerIndex(null);
      setAnswerSubmitted(false);
      setTimer(25);

      const sessionRef = ref(db, `sessions/${sessionCode}`);
      update(sessionRef, { currentQuestionIndex: newIndex });
    } else {
      setShowRankingScreen(true);
    }
  };

  const handleSelectAnswer = (index) => {
    if (!answerSubmitted) {
      setSelectedAnswerIndex(index);
      console.log("Selected answer index:", index);
    }
  };

  // Функция для изменения цвета строк в таблице
  const getRowClassName = (record) => {
    if (record.place === 1) return "first-place";
    if (record.place === 2) return "second-place";
    if (record.place === 3) return "third-place";
    return "";
  };

  return (
    <>
      {!joined ? (
        <div className={classes.container}>
          <div className={classes.rowsMaindsd}>
            <div className={classes.rowsForm}>
              <div className={classes.RowsFormMain}>
                <h1>Welcome</h1>
                <Input
                  type="text"
                  placeholder="Your name"
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={15}
                />
                <Input
                  type="number"
                  placeholder="Session Code"
                  onChange={(e) => setSessionCode(e.target.value)}
                  maxLength={15}
                />
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button onClick={joinSession}>Join Session</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={(classes.container, classes.formdsd)}>
          {!sessionStarted ? (
            <div className={classes.container}>
              <div className={classes.rowsMaindsd}>
                <p className={classes.DsDSDS}>
                  Waiting for the session to start...
                </p>
                <p className={classes.DsDSDS}>
                  Participants: <span>{participantsCount}</span>
                </p>
              </div>
            </div>
          ) : currentQuestionIndex < questions.length ? (
            showRankingScreen ? (
              <div className={classes.rowsMain}>
                <h3 className={classes.titleLeaderboard}>Leaderboard</h3>
                <p className={classes.decrTitleLeaderboard}>
                  Next question will appear shortly...
                </p>
                <Table
                  columns={columns}
                  dataSource={ranking}
                  rowKey="name" // Уникальный ключ для строк
                  pagination={false} // Отключить пагинацию, если не нужна
                  rowClassName={getRowClassName} // Применяем стили к строкам
                />
              </div>
            ) : (
              <div className={(classes.rowsMain, classes.questionFormRows)}>
                <div className={classes.Question}>
                  Question: {questions[currentQuestionIndex].question}
                </div>
                <div className={(classes.FormMain, classes.questionForm)}>
                  {questions[currentQuestionIndex].answers.map(
                    (answer, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(idx)}
                        className={`${
                          selectedAnswerIndex === idx
                            ? "selected selectedAnswer"
                            : ""
                        }`}
                        disabled={answerSubmitted}
                      >
                        {answer}
                      </button>
                    )
                  )}
                </div>
                <div className={classes.timer}>
                  <p>Time remaining: {timer}</p>
                </div>
                <div className={classes.submitBtn}>
                  <button onClick={submitAnswer} disabled={answerSubmitted}>
                    Submit Answer
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className={classes.rowsMain}>
              <h3>End of session! See the final leaderboard.</h3>
              <Table
                columns={columns}
                dataSource={ranking}
                rowKey="name"
                pagination={false}
                rowClassName={getRowClassName} // Применяем стили к строкам
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default PublicSession;
