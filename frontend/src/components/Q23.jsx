import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import "../assets/style/q.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Q23 = () => {
  const [answer, setAnswer] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch team name on component mount
  useEffect(() => {
    const fetchTeamName = async () => {
      try {
        const response = await axios.get(
          "http://192.168.23.5:5000/users/session"
        );
        setTeamName(response.data.teamname);
      } catch (err) {
        console.error("Error fetching team name:", err);
        setError("Could not fetch team name. Try refreshing.");
      }
    };

    fetchTeamName();
  }, []);

  // Check if the round is still active
  useEffect(() => {
    const checkRoundStatus = async () => {
      try {
        const response = await axios.get(
          "http://192.168.23.5:5000/rounds/round-status"
        );
        const { active_round } = response.data;

        if (!active_round) {
          navigate("/level", { replace: true });
        }
      } catch (error) {
        console.error("Error fetching round status:", error);
      }
    };

    checkRoundStatus();
    const interval = setInterval(checkRoundStatus, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!teamName) {
      setError("Team name is missing. Please try logging in again.");
      setLoading(false);
      return;
    }

    if (!answer.trim()) {
      setError("Please enter an answer.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://192.168.23.5:5000/quiz/submit-answer",
        {
          team_name: teamName,
          question_id: "q23",
          submission_time: new Date().toISOString(),
          answer,
        }
      );

      if (response.data.success) {
        toast.success("Successfully submitted! Redirecting...");
        navigate("/level");
      } else {
        setError("Wrong answer! Try again.");
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Check if round is still active (Polling every 5 seconds)
  useEffect(() => {
    if (!teamName) return;

    let isMounted = true; // Track component mount state

    const validateAccess = async () => {
      try {
        // Fetch round status
        const roundResponse = await axios.get(
          "http://192.168.23.5:5000/rounds/round-status"
        );
        const { active_round } = roundResponse.data;

        if (!active_round && isMounted) {
          console.log("Round inactive. Redirecting...");
          navigate("/level", { replace: true });
          return;
        }

        // Fetch team responses
        const response = await fetch(
          "http://192.168.23.5:5000/rounds/team-response",
          {
            credentials: "include",
          }
        );
        const data = await response.json();

        if (
          (!data.teamReponses?.responses[0] ||
            !data.teamReponses.responses[1]) &&
          isMounted
        ) {
          navigate("/q21", { replace: true });
        }
      } catch (error) {
        console.error("Error validating access:", error);
      }
    };

    // Run validation immediately and then every 5 seconds
    validateAccess();
    const intervalId = setInterval(validateAccess, 5000);

    return () => {
      clearInterval(intervalId); // Cleanup interval on unmount
      isMounted = false;
    };
  }, [teamName, navigate]);

  return (
    <div className="q">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div id="grid">
        <div id="flex">
          <h1 id="title">ROUND 2</h1>
          <div id="question">
            <h2>Problem 3</h2>
            <p>
              Avengers are fighting in teams against Thanos in various
              locations. On Titan, Iron Man and his team are fighting, while on
              Earth, Captain America is leading a team with Black Panther. The
              given dataset contains a location column that specifies the place
              of the fight, the heroes fighting there, and their power levels.
              Now, find the top 3 most important persons in each location by
              grouping the data.
            </p>
            <h3>
              Data: <a href="#">click here</a>
            </h3>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={answer}
              id="answer"
              placeholder="Type your answer"
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
            <button type="submit" id="submit" disabled={loading}>
              {loading ? "Checking..." : "Submit"}
            </button>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Q23;
