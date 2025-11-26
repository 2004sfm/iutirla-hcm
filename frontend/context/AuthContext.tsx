'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import apiClient from "../lib/apiClient";
import { useRouter } from "next/navigation";

// --- Tipos ---

// Definimos Person alineado con tu backend
export interface Person {
    id: number;
    first_name: string;
    second_name?: string | null;
    paternal_surname: string;
    maternal_surname?: string | null;
    photo?: string | null;
    birthdate?: string | null;
}

// Definimos User alineado con tu backend
export interface User {
    pk: number;
    username: string;
    is_staff: boolean;
    person: Person | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // 1. Inicialización: Recuperar sesión y refrescar datos
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("access_token");

            if (storedToken) {
                try {
                    // 1. Restaurar header
                    if (apiClient.defaults.headers.common) {
                        apiClient.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
                    }

                    // 2. Obtener datos frescos del usuario
                    const { data } = await apiClient.get("/api/auth/user/");

                    // 3. Actualizar estado y storage
                    setUser(data);
                    localStorage.setItem("user", JSON.stringify(data));

                } catch (e: any) {
                    console.error("Error validando sesión", e);
                    // Si el token es inválido (401/403), cerramos sesión
                    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                        localStorage.removeItem("user");
                        localStorage.removeItem("access_token");
                        if (apiClient.defaults.headers.common) {
                            delete apiClient.defaults.headers.common["Authorization"];
                        }
                        setUser(null);
                    } else {
                        // Si es otro error (ej. red), intentamos usar lo que hay en storage como fallback
                        const storedUser = localStorage.getItem("user");
                        if (storedUser) {
                            try {
                                setUser(JSON.parse(storedUser));
                            } catch (parseError) {
                                console.error("Error parsing stored user fallback", parseError);
                            }
                        }
                    }
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    // 2. Login
    const login = async (username: string, password: string) => {
        try {
            // Solicitud al backend
            const response = await apiClient.post("/api/auth/login/", {
                username,
                password,
            });

            const { access, user: userData } = response.data;
            const typedUser = userData as User;

            // Actualizar Estados y Storage
            setUser(typedUser);
            localStorage.setItem("user", JSON.stringify(typedUser));
            localStorage.setItem("access_token", access);

            // Configurar Axios para futuras peticiones
            if (apiClient.defaults.headers.common) {
                apiClient.defaults.headers.common["Authorization"] = `Bearer ${access}`;
            }

            // Redirección basada en rol
            if (typedUser.is_staff) {
                router.push("/admin/dashboard");
            } else {
                router.push("/");
            }

        } catch (error) {
            throw error;
        }
    };

    // 3. Logout
    const logout = async () => {
        try {
            await apiClient.post("/api/auth/logout/");
        } catch (error) {
            console.warn("Logout en servidor falló, cerrando sesión local.", error);
        } finally {
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("access_token");

            if (apiClient.defaults.headers.common) {
                delete apiClient.defaults.headers.common["Authorization"];
            }

            router.push("/login");
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};