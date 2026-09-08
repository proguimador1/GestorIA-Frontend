import { useState } from "react";
import api from "../../services/api";

export default function SolicitarRecuperacao() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await api.post("/auth/users/reset_password/", {
        email: email,
      });

      setStatus("success");
      setMessage(
        "Link de solicitação de recuperação de senha enviado com sucesso",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        `Ocorreu um erro no processo de recuperação de senha: ${error}`,
      );
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>GestorIA - Esqueci minha senha</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <label>E-mail cadastrado:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="pedro@exemplo.com"
          style={{ padding: "8px" }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          style={{ padding: "10px", cursor: "pointer" }}
        >
          {status === "loading" ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>
      {message && (
        <p
          style={{
            marginTop: "15px",
            color: status === "error" ? "red" : "green",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
