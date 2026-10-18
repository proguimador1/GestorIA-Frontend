// Moldura das telas públicas (login, criar conta e recuperação de senha).
export default function AuthLayout({ eyebrow, title, lead, children, footer }) {
  return (
    <div className="auth">
      <div className="box">
        <div className="logo">Gestor<b>IA</b></div>
        <div className="card">
          <div className="eyebrow mono">{eyebrow}</div>
          <h1 style={{ marginTop: 14 }}>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children}
        </div>
        {footer}
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return <div className="fld"><label className="mono lab">{label}</label>{children}</div>
}
