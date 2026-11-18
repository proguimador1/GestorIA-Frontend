import PageHead from '../components/PageHead.jsx'
import TabRow from '../components/TabRow.jsx'
import FilterBar, { Periodo } from '../components/FilterBar.jsx'
import Visao from './FinVisao.jsx'
import Detalhamento from './FinDetalhamento.jsx'
import { useApp } from '../store/AppContext.jsx'

export default function Financas() {
  const { F, setF, fin } = useApp()
  return (
    <>
      <PageHead eyebrow={'Finanças · ' + fin.lab().toUpperCase()}>Para onde foi o dinheiro da cozinha</PageHead>
      <TabRow tabs={[['visao', 'Visão geral'], ['det', 'Detalhamento']]} active={F.tab} onTab={t => setF({ tab: t, open: null })} />
      {/* Prancheta: barra de período com a aba "Período" presa à prancheta; o conteúdo da aba fica sobre a prancheta, sob o prendedor.
          Na Visão geral, os filtros ficam fixos abaixo do período; no Detalhamento, dentro da tabela. */}
      <div className="prancheta-topo">
        <FilterBar chips={F.tab === 'visao'} />
        <Periodo aba />
      </div>
      <div className="prancheta">
        <div className="prendedor" aria-hidden="true"><i /></div>
        {F.tab === 'visao' ? <Visao /> : <Detalhamento />}
      </div>
    </>
  )
}
