
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSiteSettings } from '../lib/api';

interface SettingsContextType {
    settings: Record<string, any>;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Record<string, any>>({
        transfer_discount: 15, // Default fallback
    });
    const [loading, setLoading] = useState(true);

    const refreshSettings = useCallback(async (force = false) => {
        try {
            // Usar caché de localStorage para no hacer un fetch en cada carga
            if (!force) {
                try {
                    const cached = localStorage.getItem('shams_settings_v1');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        setSettings(prev => ({ ...prev, ...parsed }));
                        setLoading(false);
                        // Actualizar en background sin bloquear
                        getSiteSettings().then(data => {
                            if (!data) return;
                            const parsedData = { ...data };
                            if (parsedData.transfer_discount) parsedData.transfer_discount = Number(parsedData.transfer_discount);
                            setSettings(prev => ({ ...prev, ...parsedData }));
                            try { localStorage.setItem('shams_settings_v1', JSON.stringify(parsedData)); } catch {}
                        }).catch(() => {});
                        return;
                    }
                } catch {}
            }
            const data = await getSiteSettings();
            if (data) {
                const parsedData = { ...data };
                if (parsedData.transfer_discount) {
                    parsedData.transfer_discount = Number(parsedData.transfer_discount);
                }
                setSettings(prev => ({ ...prev, ...parsedData }));
                try { localStorage.setItem('shams_settings_v1', JSON.stringify(parsedData)); } catch {}
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
