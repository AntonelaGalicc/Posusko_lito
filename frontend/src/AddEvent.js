import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddEvent = () => {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

    // Kreiraj objekt događaja
    const newEvent = {
      id: Date.now(), // ideja za jedinstveni id
      title,
      image,
      description,
    };

    fetch(`${apiUrl}/send_event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Ovdje možeš dodati username header ako backend to očekuje
      },
      body: JSON.stringify(newEvent),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Greška kod slanja događaja");
          });
        }
        return res.json();
      })
      .then(() => {
        alert("Događaj uspješno dodan!");
        navigate("/events"); // vrati na listu događaja
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className="form-container">
      <h2>Dodaj novi događaj</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Naslov događaja"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="URL slike"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          required
        />
        <textarea
          placeholder="Opis događaja"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button type="submit">Dodaj događaj</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default AddEvent;
