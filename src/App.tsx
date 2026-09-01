import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ThemeProvider } from './theme'
import { Home } from './pages/Home'
import { GlossaryPage } from './pages/Glossary'
import { CalculatorPage } from './pages/tools/CalculatorPage'
import { VlsmPage } from './pages/tools/VlsmPage'
import { SummarizerPage } from './pages/tools/SummarizerPage'
import { WhySubnet } from './pages/modules/WhySubnet'
import { Binary } from './pages/modules/Binary'
import { IPv4Anatomy } from './pages/modules/IPv4Anatomy'
import { MasksAndCidr } from './pages/modules/MasksAndCidr'
import { SubnetAnatomy } from './pages/modules/SubnetAnatomy'
import { SubnettingPractice } from './pages/modules/SubnettingPractice'
import { Vlsm } from './pages/modules/Vlsm'
import { Summarization } from './pages/modules/Summarization'
import { IPv6Anatomy } from './pages/modules/IPv6Anatomy'
import { IPv6Subnetting } from './pages/modules/IPv6Subnetting'
import { ProductionDesign } from './pages/modules/ProductionDesign'
import { Operations } from './pages/modules/Operations'

export function App() {
  return (
    <ThemeProvider>
      {/* HashRouter keeps deep links working on GitHub Pages, which has no SPA rewrite. */}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/modules/why-subnet" element={<WhySubnet />} />
            <Route path="/modules/binary" element={<Binary />} />
            <Route path="/modules/ipv4-anatomy" element={<IPv4Anatomy />} />
            <Route path="/modules/masks-and-cidr" element={<MasksAndCidr />} />
            <Route path="/modules/subnet-anatomy" element={<SubnetAnatomy />} />
            <Route path="/modules/subnetting-practice" element={<SubnettingPractice />} />
            <Route path="/modules/vlsm" element={<Vlsm />} />
            <Route path="/modules/summarization" element={<Summarization />} />
            <Route path="/modules/ipv6-anatomy" element={<IPv6Anatomy />} />
            <Route path="/modules/ipv6-subnetting" element={<IPv6Subnetting />} />
            <Route path="/modules/production-design" element={<ProductionDesign />} />
            <Route path="/modules/operations" element={<Operations />} />
            <Route path="/tools/calculator" element={<CalculatorPage />} />
            <Route path="/tools/vlsm" element={<VlsmPage />} />
            <Route path="/tools/summarizer" element={<SummarizerPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}
