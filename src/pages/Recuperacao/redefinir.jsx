import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function RedefinirSenha() {
  // Captura os parâmetros dinâmicos da URL
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState("");
  const [status, setStatus] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // Envia os dados da URL + a nova senha para o Django
      await api.post("/auth/users/reset_password_confirm/", {
        uid: uid,
        token: token,
        new_password: novaSenha,
      });

      setStatus("success");
      setMensagem("Senha alterada com sucesso! Redirecionando para o login...");

      // Joga o usuário de volta para a tela de login após 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setStatus("error");
      // Erro 400 aqui geralmente significa que o token expirou ou é inválido
      setMensagem(`Erro ao prosseguir com a nova senha: ${error}.`);
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
      <h2>Criar Nova Senha</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <label>Digite sua nova senha:</label>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
          placeholder="Mínimo 8 caracteres"
          style={{ padding: "8px" }}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          style={{ padding: "10px" }}
        >
          {status === "loading" ? "Salvando..." : "Salvar Nova Senha"}
        </button>
      </form>
      {mensagem && (
        <p
          style={{
            marginTop: "15px",
            color: status === "error" ? "red" : "green",
          }}
        >
          {mensagem}
        </p>
      )}
    </div>
  );
}
