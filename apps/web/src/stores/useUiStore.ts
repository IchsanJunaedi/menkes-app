import { create } from "zustand";

interface UiState {
    isSidebarOpen: boolean;
    activePatientId: string | null;
    activeEncounterId: string | null;
    toggleSidebar: () => void;
    setActivePatient: (id: string | null) => void;
    setActiveEncounter: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
    isSidebarOpen: true,
    activePatientId: null,
    activeEncounterId: null,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setActivePatient: (id) => set({ activePatientId: id }),
    setActiveEncounter: (id) => set({ activeEncounterId: id }),
}));
