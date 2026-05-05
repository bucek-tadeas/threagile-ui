/*

Starting point for threagile-ui

*/

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DrawPage from "@features/draw/DrawPage";
import { ErrorBoundary } from "./ErrorBoundary";

import { DataAssetProvider, RisksIdentifiedProvider, SharedRuntimesProvider, RiskTrackingProvider, IndividualRiskCategoriesProvider } from "@context/ThreatModelContext";
import { TagProvider } from "@context/TagContext";
import { NotificationProvider } from "@context/NotificationContext";

const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <NotificationProvider>
          <TagProvider>
            <RisksIdentifiedProvider>
              <DataAssetProvider>
                <SharedRuntimesProvider>
                  <RiskTrackingProvider>
                    <IndividualRiskCategoriesProvider>
                      <Routes>
                        <Route path="/" element={<DrawPage />} />
                      </Routes>
                    </IndividualRiskCategoriesProvider>
                  </RiskTrackingProvider>
                </SharedRuntimesProvider>
              </DataAssetProvider>
            </RisksIdentifiedProvider>
          </TagProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
