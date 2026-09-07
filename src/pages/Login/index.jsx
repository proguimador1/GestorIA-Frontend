import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";



export default function Login() {
    const { login } = useContext(AuthContext)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await login(email, password)
        }
        catch (error) {
            alert(`Ocorreu um erro durant o Login: ${error}`)
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
            <h2>Acessar Geladeira</h2>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required />
            <button type="submit">Entrar</button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <Link to="/esqueci-senha">Esqueci a senha</Link>
                <Link to="/cadastro">Criar conta</Link>
            </div>
        </form>
    )
}