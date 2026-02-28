import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
AUTH_HEADER = {"Authorization": "Bearer YOUR_BASIC_TOKEN_HERE"}  # Replace YOUR_BASIC_TOKEN_HERE with actual token


def create_temp_super_admin(email, password):
    url = f"{BASE_URL}/api/super-admin/create-temp-super-admin"
    payload = {"email": email, "password": password}
    headers = {
        "Content-Type": "application/json",
        **AUTH_HEADER,
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "userId" in data and uuid.UUID(data["userId"])
    return data["userId"]


def delete_temp_super_admin(user_id):
    # The PRD doesn't specify a delete user API.
    # For the safety of cleanup in tests, this would be a placeholder if such an endpoint existed.
    # Since no delete endpoint is specified, this function will not do anything.
    pass


def add_credits_to_user(user_id, amount, reason=None):
    url = f"{BASE_URL}/api/super-admin/users/{user_id}/credits"
    payload = {"amount": amount}
    if reason is not None:
        payload["reason"] = reason
    headers = {
        "Content-Type": "application/json",
        **AUTH_HEADER,
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()


def test_fetch_user_credit_balance():
    import random
    import string

    # Create a temporary super admin user
    email = f"test-{uuid.uuid4()}@example.com"
    password = "TestPassword123!"
    user_id = None

    try:
        user_id = create_temp_super_admin(email, password)

        headers = {
            **AUTH_HEADER,
        }

        # Initially, user probably has no credit record; expect 404 or possibly 200 with balance 0.
        url = f"{BASE_URL}/api/super-admin/users/{user_id}/credits"
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        if response.status_code == 404:
            # No credit record as expected initially
            pass
        elif response.status_code == 200:
            data = response.json()
            assert "balance" in data
            assert isinstance(data["balance"], (int, float))
        else:
            assert False, f"Unexpected status code {response.status_code}"

        # Add credits so that there is a credit record
        add_response = add_credits_to_user(user_id, amount=100, reason="Initial credits for testing")
        assert "newBalance" in add_response
        new_balance = add_response["newBalance"]
        assert isinstance(new_balance, (int, float))
        assert new_balance >= 100

        # Now fetch the credit balance and verify
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()
        assert "balance" in data
        assert isinstance(data["balance"], (int, float))
        assert data["balance"] == new_balance

        # Test invalid userId (malformed UUID)
        invalid_user_id = "invalid-uuid-string"
        url_invalid = f"{BASE_URL}/api/super-admin/users/{invalid_user_id}/credits"
        response_invalid = requests.get(url_invalid, headers=headers, timeout=TIMEOUT)
        assert response_invalid.status_code in (400, 404), f"Expected 400 or 404 for invalid userId, got {response_invalid.status_code}"

        # Test valid but non-existing UUID userId (random UUID)
        random_user_id = str(uuid.uuid4())
        url_random = f"{BASE_URL}/api/super-admin/users/{random_user_id}/credits"
        response_random = requests.get(url_random, headers=headers, timeout=TIMEOUT)
        assert response_random.status_code == 404, f"Expected 404 for non-existing userId, got {response_random.status_code}"

    finally:
        if user_id:
            delete_temp_super_admin(user_id)


test_fetch_user_credit_balance()