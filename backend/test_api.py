import requests

# CONFIGURACIÓN
BASE_URL = "http://127.0.0.1:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login/" 
TARGET_URL = f"{BASE_URL}/core/national-ids/"

# CREDENCIALES
USERNAME = "admin" 
PASSWORD = "123" # <--- ¡TU PASSWORD!

# ID de la persona a la que vamos a "torturar" con las pruebas
PERSON_ID = 1 

def test_duplicate_id():
    session = requests.Session()
    print(f"🔵 1. Login con {USERNAME}...")
    
    # --- LOGIN ---
    login_resp = session.post(LOGIN_URL, json={"username": USERNAME, "password": PASSWORD})
    if login_resp.status_code != 200:
        print(f"❌ Error Login: {login_resp.text}")
        return

    token = login_resp.json().get('access') or login_resp.json().get('key')
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login exitoso.\n")

    # --- LIMPIEZA PREVIA (Borrar cédulas viejas de esta persona) ---
    print("🧹 Limpiando datos anteriores...")
    existing = requests.get(f"{TARGET_URL}?person={PERSON_ID}", headers=headers).json()
    results = existing.get('results', existing) if isinstance(existing, dict) else existing
    
    for item in results:
        requests.delete(f"{TARGET_URL}{item['id']}/", headers=headers)
    print("✨ Persona limpia (0 documentos).\n")

    # --- INTENTO 1: PRIMERA CÉDULA (Debe funcionar) ---
    print("🔵 2. Creando Cédula #1 (V-111111)...")
    data1 = {
        "person": PERSON_ID,
        "category": "CEDULA",
        "document_type": "V",
        "number": "111111",
        "is_primary": "true"
    }
    # Usamos 'data' para simular multipart/form-data (como el frontend)
    resp1 = requests.post(TARGET_URL, data=data1, headers=headers)
    
    if resp1.status_code == 201:
        print("✅ Éxito: Primera cédula creada.")
    else:
        print(f"❌ Error inesperado en la primera: {resp1.text}")
        return

    # --- INTENTO 2: SEGUNDA CÉDULA (Debe fallar) ---
    print("\n🔵 3. Intentando crear Cédula #2 (V-222222) para la MISMA persona...")
    print("   (Debe fallar porque una persona no puede tener dos documentos categoría 'CEDULA')")
    
    data2 = {
        "person": PERSON_ID,
        "category": "CEDULA", # Misma categoría
        "document_type": "V",
        "number": "222222",   # Diferente número, pero eso no importa
        "is_primary": "false"
    }
    
    resp2 = requests.post(TARGET_URL, data=data2, headers=headers)

    print(f"Status Code: {resp2.status_code}")
    print(f"Respuesta: {resp2.text}")

    # --- VERIFICACIÓN ---
    if resp2.status_code == 400:
        # Buscamos el mensaje de error global (non_field_errors)
        if "ya tiene un documento de esta categoría" in resp2.text:
            print("\n🏆 ¡PRUEBA SUPERADA! El sistema bloqueó la segunda cédula correctamente.")
        else:
            print("\n⚠️ Alerta: Dio error 400 pero con un mensaje diferente al esperado.")
    else:
        print(f"\n❌ FALLÓ. El sistema permitió crearla (Code {resp2.status_code}). ¡Revisa unique_together!")

if __name__ == "__main__":
    test_duplicate_id()