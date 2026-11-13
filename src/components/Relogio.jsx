import { useEffect, useState } from 'react'

// Relógio do app: a hora continua sendo acompanhada a cada segundo (precisa, no horário de Fortaleza),
// mas a interface mostra apenas a data, ao lado do nome de cada aba (texto vermelho do cabeçalho).
export const FUSO = 'America/Fortaleza'

// Data e hora atuais, atualizadas a cada segundo
export function useAgora() {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return agora
}

// Data atual por extenso: "25 de outubro de 2026" (o cabeçalho deixa em maiúsculas)
export const dataExtenso = d => d.toLocaleDateString('pt-BR', { timeZone: FUSO, day: 'numeric', month: 'long', year: 'numeric' })

export default function DataAtual() {
  const agora = useAgora()
  return <time dateTime={agora.toISOString()} title={agora.toLocaleString('pt-BR', { timeZone: FUSO })}>{dataExtenso(agora)}</time>
}
