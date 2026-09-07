import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";



export default function Cadastro() {
    const { cadastro } = useContext(AuthContext)
    const [formData, setFormData] = useState({
        email: '', nome_completo: '', password: '', re_password: ''
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await cadastro(formData.email, formData.nome_completo, formData.password, formData.re_password)
        }
        catch (error) {
            alert(`Erro ao cadastrar. ${error}`)
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
            <h2>Criar Conta</h2>
            <input name="email" type="email" placeholder="E-mail" onChange={handleChange} required />
            <input name="nome_completo" placeholder="Nome Completo" onChange={handleChange} required />
            <input name="password" type="password" placeholder="Senha" onChange={handleChange} required />
            <input name="re_password" type="password" placeholder="Confirme a Senha" onChange={handleChange} required />
            <button type="submit">Cadastrar</button>

            <Link to="/login">Já tem conta? Entrar</Link>
        </form>
    )
}