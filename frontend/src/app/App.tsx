/*

Starting point for threagile-ui

*/

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "@features/welcome/WelcomePage";
import DrawPage from "@features/draw/DrawPage";

import { DataAssetProvider, RisksIdentifiedProvider, SharedRuntimesProvider, RiskTrackingProvider, IndividualRiskCategoriesProvider } from "@context/ThreatModelContext";
import { TagProvider } from "@context/TagContext";

const App = () => {
  return (
    <Router>
      <TagProvider>
        <RisksIdentifiedProvider>
          <DataAssetProvider>
            <SharedRuntimesProvider>
              <RiskTrackingProvider>
                <IndividualRiskCategoriesProvider>
                  <Routes>
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/draw" element={<DrawPage />} />
                  </Routes>
                </IndividualRiskCategoriesProvider>
              </RiskTrackingProvider>
            </SharedRuntimesProvider>
          </DataAssetProvider>
        </RisksIdentifiedProvider>
      </TagProvider>
    </Router>
  );
};

export default App;
