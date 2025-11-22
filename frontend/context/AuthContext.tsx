'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import apiClient from "../lib/apiClient";
import { useRouter } from "next/navigation";
// import { AxiosError } from "axios";

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
    // ... otros campos si son necesarios para mostrar en el header/perfil
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
    // Login devuelve Promise<void>, pero ahora sabemos que puede fallar
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // 1. Inicialización: Recuperar sesión al recargar la página
    useEffect(() => {
        const initAuth = () => {
            const storedUser = localStorage.getItem("user");
            const storedToken = localStorage.getItem("access_token");

            if (storedUser && storedToken) {
                try {
                    const parsedUser = JSON.parse(storedUser) as User;
                    setUser(parsedUser);
                    // Restauramos el header para axios
                    if (apiClient.defaults.headers.common) {
                        apiClient.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
                    }
                } catch (e) {
                    console.error("Error parsing user from storage", e);
                    localStorage.removeItem("user");
                    localStorage.removeItem("access_token");
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
            // IMPORTANTE: No "tragamos" el error. Lo lanzamos hacia arriba.
            // Así el formulario de Login puede hacer: 
            // try { await login(...) } catch (err) { setError("Credenciales inválidas") }
            throw error;
        }
    };

    // 3. Logout
    const logout = async () => {
        try {
            // Intentamos avisar al backend (blacklist token)
            // No importa si falla (ej: sin internet), igual cerramos sesión local
            await apiClient.post("/api/auth/logout/");
        } catch (error) {
            console.warn("Logout en servidor falló (posiblemente token ya vencido), cerrando sesión local.", error);
        } finally {
            // Limpieza Local (Siempre se ejecuta)
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