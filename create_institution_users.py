
import requests
import json

BASE_URL = "http://localhost:3000"  # **IMPORTANT: Change this if your app is hosted elsewhere**

SUPER_ADMIN_EMAIL = "admin@hiremind.app"  # **IMPORTANT: Replace with your actual super admin email**
SUPER_ADMIN_PASSWORD = "admin123"      # **IMPORTANT: Replace with your actual super admin password**

def authenticate_super_admin(email, password):
    login_url = f"{BASE_URL}/api/super-admin/login"
    headers = {"Content-Type": "application/json"}
    payload = {"email": email, "password": password}
    try:
        response = requests.post(login_url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()  # Raise an exception for HTTP errors
        login_data = response.json()
        if login_data.get("success"):
            # The token is likely set as a cookie, so we need to pass the session cookie
            return response.cookies
        else:
            print(f"Super admin login failed: {login_data.get('error')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error during super admin login: {e}")
        return None

def create_institution_user(session_cookies, name, email, password):
    create_user_url = f"{BASE_URL}/api/super-admin/institution-users/create"
    headers = {"Content-Type": "application/json"}
    payload = {"name": name, "email": email, "password": password}
    try:
        response = requests.post(create_user_url, headers=headers, cookies=session_cookies, data=json.dumps(payload))
        response.raise_for_status()
        user_data = response.json()
        if response.status_code == 200:
            print(f"Successfully created institution user:")
            print(f"  Name: {name}")
            print(f"  Email: {email}")
            print(f"  User ID: {user_data.get('userId')}")
        else:
            print(f"Failed to create institution user {name}: {user_data.get('error')}")
        return user_data
    except requests.exceptions.RequestException as e:
        print(f"Error creating institution user {name}: {e}")
        return None

def main():
    print("Attempting to authenticate super admin...")
    session_cookies = authenticate_super_admin(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)

    if session_cookies:
        print("Super admin authenticated successfully.")
        
        institutions_to_create = [
            {"name": "IIT Delhi", "email_prefix": "iitdelhi"},
            {"name": "IIT Bombay", "email_prefix": "iitbombay"},
            # Add more institutions here
        ]

        for inst in institutions_to_create:
            institution_name = inst["name"]
            institution_email = f"{inst['email_prefix']}@institution.com" # Using a generic domain
            institution_password = "SecurePassword123" # **IMPORTANT: Generate strong, unique passwords in a real scenario**

            print(f"Creating institution user for {institution_name}...")
            create_institution_user(session_cookies, institution_name, institution_email, institution_password)
    else:
        print("Super admin authentication failed. Cannot create institution users.")

if __name__ == "__main__":
    main()
