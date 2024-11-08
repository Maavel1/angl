import React, { useState } from "react";
import { db } from "../../base/firebase";
import { ref, set, update, push } from "firebase/database";

const ADMIN_PASSWORD = "FirstTwenli@@";

function AdminPanel() {
  const [sessionCode, setSessionCode] = useState("");
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");

  const handleLogin = () => {
    if (enteredPassword === ADMIN_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("Incorrect password. Access denied.");
    }
  };

  const addQuestion = () => {
    const questionsRef = ref(db, `questions`);
    const newQuestionRef = push(questionsRef);
    console.log("Adding question:", { question, answers, correctAnswer });
    set(newQuestionRef, {
      question: question,
      answers: answers,
      correctAnswer: correctAnswer,
    });
    setQuestion("");
    setAnswers(["", "", "", ""]);
    setCorrectAnswer(0);
  };

  const createSession = () => {
    const newSessionRef = ref(db, `sessions/${sessionCode}`);
    set(newSessionRef, {
      isActive: false,
      questionsRef: "questions",
      participants: {},
      currentQuestionIndex: 0,
    });
  };

  const startSession = () => {
    const sessionRef = ref(db, `sessions/${sessionCode}`);
    update(sessionRef, { isActive: true, currentQuestionIndex: 0 });
  };

  return (
    <div>
      {!isAuthorized ? (
        <div>
          <h3>Admin Login</h3>
          <input
            type="password"
            placeholder="Enter Password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Session Code"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
          />
          <button onClick={createSession}>Create Session</button>
          <button onClick={startSession}>Start Session</button>

          <div>
            <h3>Add Question</h3>
            <input
              type="text"
              placeholder="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            {answers.map((answer, index) => (
              <div key={index}>
                <input
                  type="text"
                  placeholder={`Answer ${index + 1}`}
                  value={answer}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctAnswer === index}
                  onChange={() => setCorrectAnswer(index)}
                />
                Correct
              </div>
            ))}
            <button onClick={addQuestion}>Add Question</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
