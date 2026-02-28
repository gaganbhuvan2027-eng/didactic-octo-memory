import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# As the instructions specify "authType": "basic token" but provide empty credentials,
# we assume no authentication token is required or it's handled outside this test.

def test_createorupdateasuperadminuser():
    url = f"{BASE_URL}/api/super-admin/create-temp-super-admin"
    headers = {
        "Content-Type": "application/json"
    }

    # Sample valid payload with email and password
    payload = {
        "email": "testsuperadmin@example.com",
        "password": "StrongPassword123!"
    }

    # Test successful creation or update of super admin user
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        data = response.json()
        assert "userId" in data, "Response JSON missing 'userId'"
        assert isinstance(data["userId"], str) and len(data["userId"]) > 0, "'userId' should be a non-empty string"
        assert "message" in data, "Response JSON missing 'message'"
        assert isinstance(data["message"], str), "'message' should be a string"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    # Test handling of server error (simulate by sending payload that might cause server error)
    # Since no explicit payload that causes error is specified,
    # we simulate an internal server error by sending malformed payload (missing password)
    error_payload = {
        "email": "testsuperadmin@example.com"
        # "password" missing to cause error, but per schema it's required, server might error out or respond 4xx
    }

    try:
        error_response = requests.post(url, json=error_payload, headers=headers, timeout=TIMEOUT)
        # Server is expected to respond with 4xx or 5xx code because of missing password,
        # so we accept 400+ but for "500" internal server error we check explicitly
        if error_response.status_code == 500:
            pass  # This is expected for internal server error
        else:
            # It may return 400 or other client error instead of 500,
            # so we just assert it's not 200 success
            assert error_response.status_code != 200, "Expected error response code, got 200"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed with exception during error handling test: {e}"


test_createorupdateasuperadminuser()