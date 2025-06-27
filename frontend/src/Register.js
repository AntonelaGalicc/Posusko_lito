import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://158.179.216.162:5000";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const data = {
      email: email,
      password: password,
    };

    try {
      const response = await axios.post(`${API_URL}/register`, data);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data.message || "Greška pri registraciji");
    }
  };

  return (
    <div className="form-container">
      <h2>Registracija</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Registriraj se</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;
