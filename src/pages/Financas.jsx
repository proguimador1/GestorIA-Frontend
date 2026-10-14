import PageHead from '../components/PageHead.jsx'
import TabRow from '../components/TabRow.jsx'
import FilterBar from '../components/FilterBar.jsx'
import Visao from './FinVisao.jsx'
import Detalhamento from './FinDetalhamento.jsx'
import { useApp } from '../store/AppContext.jsx'

export default function Financas() {
  const { F, setF, fin } = useApp()
  return (
    <>
      <PageHead eyebrow={'Finanças · ' + fin.lab().toUpperCase()}>Para onde foi o dinheiro da cozinha</PageHead>
      <TabRow tabs={[['visao', 'Visão geral'], ['det', 'Detalhamento']]} active={F.tab} onTab={t => setF({ tab: t, open: null })} />
      <FilterBar chips={F.tab === 'det' || !!F.cat || !!F.est} />
      {F.tab === 'visao' ? <Visao /> : <Detalhamento />}
    </>
  )
}
