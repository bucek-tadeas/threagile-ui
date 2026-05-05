/* eslint-disable react-refresh/only-export-components */
/*

Context providers for non-graph information and graph assets.

ThreatModelAssetContext is used for graph assets - technical assets, communication links, trust boundaries

createThreatModelContext is used for creating context for - data assets, shared runtimes, risks identified, individual risk categories, risk tracking

*/

import type { DataAsset, IndividualRiskCategories, RisksIdentified, RiskTracking, SharedRuntimes } from "@components/types/threagileComponents";
import React, { createContext, useContext, useState } from "react";
import type { TechnicalAsset, CommunicationLink, TrustBoundary } from "@components/types/threagileComponents";

interface ThreatModelAssetContextValue {
    technicalAssets: TechnicalAsset[];
    communicationLinks: CommunicationLink[];
    trustBoundaries: TrustBoundary[];

    setTechnicalAssets?: React.Dispatch<React.SetStateAction<TechnicalAsset[]>>;
    setCommunicationLinks?: React.Dispatch<React.SetStateAction<CommunicationLink[]>>;
    setTrustBoundaries?: React.Dispatch<React.SetStateAction<TrustBoundary[]>>;
}

const ThreatModelAssetContext = createContext<ThreatModelAssetContextValue | null>(null);

export const useThreatModel = () => {
    const ctx = useContext(ThreatModelAssetContext);
    if (!ctx) throw new Error("useThreatModel must be used inside ThreatModelProvider");
    return ctx;
};

interface Props {
    value: ThreatModelAssetContextValue;
    children: React.ReactNode;
}

export const ThreatModelAssetProvider: React.FC<Props> = ({ value, children }) => {
    return <ThreatModelAssetContext.Provider value={value}>{children}</ThreatModelAssetContext.Provider>;
};

function createThreatModelContext<T extends { _internalId: string }>() {
    interface Value {
        elements: T[];
        addElement: (element: T) => void;
        updateElementField: <K extends keyof T>(
            _internalId: string,
            field: K,
            value: T[K]
        ) => void;
        deleteElement: (_internalId: string) => void;
        deleteAllElements: () => void;
    }

    const Context = createContext<Value | null>(null);

    function Provider({ children }: { children: React.ReactNode }) {
        const [elements, setElements] = useState<T[]>([]);

        const addElement = (element: T) =>
            setElements(prev => [...prev, element]);

        const updateElementField = <K extends keyof T>(
            _internalId: string,
            field: K,
            value: T[K]
        ) => {
            setElements(prev =>
                prev.map(e =>
                    e._internalId === _internalId
                        ? { ...e, [field]: value }
                        : e
                )
            );
        };

        const deleteElement = (_internalId: string) =>
            setElements(prev => prev.filter(e => e._internalId !== _internalId));

        const deleteAllElements = () => setElements([]);

        return (
            <Context.Provider
                value={{
                    elements,
                    addElement,
                    updateElementField,
                    deleteElement,
                    deleteAllElements,
                }}
            >
                {children}
            </Context.Provider>
        );
    }

    function useThreatModel() {
        const ctx = useContext(Context);
        if (!ctx) {
            throw new Error("useThreatModel must be used inside its Provider");
        }
        return ctx;
    }

    return { Provider, useThreatModel };
}

export const { Provider: DataAssetProvider, useThreatModel: useDataAssets } = createThreatModelContext<DataAsset>();
export const { Provider: SharedRuntimesProvider, useThreatModel: useSharedRuntimes } = createThreatModelContext<SharedRuntimes>();
export const { Provider: RisksIdentifiedProvider, useThreatModel: useRisksIdentified } = createThreatModelContext<RisksIdentified>();
export const { Provider: IndividualRiskCategoriesProvider, useThreatModel: useIndividualRiskCategories } = createThreatModelContext<IndividualRiskCategories>();
export const { Provider: RiskTrackingProvider, useThreatModel: useRiskTracking } = createThreatModelContext<RiskTracking>();