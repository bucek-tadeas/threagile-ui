/*

Tag context provider for global storing of tag values

This is an abstraction on top of threagile. Tags are added only to different assets and final "tags_available" is derived only on execution

*/

import React, { createContext, useState, useContext, useMemo } from "react";

interface TagContextType {
    tags: string[];
    addTag: (tag: string) => void;
}

const TagContext = createContext<TagContextType | undefined>(undefined);

export const TagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tags, setTags] = useState<string[]>([]);

    const addTag = (newTag: string) => {
        setTags((prev) => {
            const tag = newTag.trim();
            if (!tag || prev.includes(tag)) return prev;
            return [...prev, tag];
        });
    };

    const value = useMemo(() => ({ tags, addTag }), [tags]);

    return <TagContext.Provider value={value}>{children}</TagContext.Provider>;
};

export const useTags = () => {
    const ctx = useContext(TagContext);
    if (!ctx) throw new Error("useTags must be used inside a TagProvider");
    return ctx;
};