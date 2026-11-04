export default function PageHead({ eyebrow, children }) {
  return (<><div className="eyebrow mono">{eyebrow}</div><h1>{children}</h1></>)
}
