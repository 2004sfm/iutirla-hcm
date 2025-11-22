import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

// Definimos la estructura de los items en la cola de espera
interface QueueItem {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

// Usamos variable de entorno para no quemar la URL
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// --- Variables para el Bloqueo de Concurrencia ---
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

// Función para procesar la cola. Recibe un error (si falló) o el nuevo token.
const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// --- Interceptor de Petición ---
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // No inyectar token en rutas de auth para evitar conflictos
        if (config.url && (config.url.includes("/auth/login") || config.url.includes("/auth/register"))) {
            return config;
        }

        // Validamos que estemos en el cliente
        if (typeof window !== "undefined") {
            const accessToken = localStorage.getItem("access_token");
            if (accessToken) {
                config.headers.set("Authorization", `Bearer ${accessToken}`);
            }
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// --- Interceptor de Respuesta ---
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Si no hay request original (error de red raro), rechazamos
        if (!originalRequest) {
            return Promise.reject(error);
        }

        // 1. PROTECCIÓN ANTI-BUCLE: Si el error viene del refresh endpoint, es el fin.
        if (originalRequest.url?.includes("/token/refresh/")) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // 2. Detección de 401 (Token vencido)
        if (error.response?.status === 401 && !originalRequest._retry) {

            // CASO A: Ya se está refrescando. A la cola.
            if (isRefreshing) {
                return new Promise<AxiosResponse>((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.set("Authorization", `Bearer ${token}`);
                            resolve(apiClient(originalRequest));
                        },
                        reject: (err: unknown) => reject(err)
                    });
                });
            }

            // CASO B: Iniciamos el refresco.
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Petición de refresco
                const response = await apiClient.post<{ access: string }>("/api/auth/token/refresh/");
                const newAccessToken = response.data.access;

                if (typeof window !== "undefined") {
                    localStorage.setItem("access_token", newAccessToken);
                }

                // Actualizamos defaults
                apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

                // Procesamos la cola
                processQueue(null, newAccessToken);

                // Reintentamos la original
                originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Si falla, rechazamos toda la cola con el error correspondiente
                // Casteamos a AxiosError si es posible, o pasamos el error tal cual
                const axiosError = refreshError instanceof AxiosError ? refreshError : new AxiosError("Refresh failed");
                processQueue(axiosError, null);

                if (typeof window !== "undefined") {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);

            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;