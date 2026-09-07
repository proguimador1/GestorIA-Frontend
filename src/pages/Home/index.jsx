import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";



export default function Home() {
    const { logout } = useContext(AuthContext)

    return (
        <div>
            <h1>Bem-vindo à Geladeira Virtual!</h1>
            <p>Aqui ficam os dados protegidos pelo Token JWT.</p>

            <button onClick={logout} style={{ background: 'red', color: 'white' }}>
                Sair do sistema
            </button>
        </div>
    )
}