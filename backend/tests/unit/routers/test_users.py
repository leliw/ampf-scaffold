from core.users.user_model import User, UserHeader
from ampf.testing import ApiTestClient


def test_get_all_unauthenticated(client: ApiTestClient):
    # When: I get all users without authentication
    # Then: I get 401
    client.get("/api/users", 401)


def test_get_all(client: ApiTestClient, headers):
    # Given: An initialised storage with default user
    # When: I get all users
    r = client.get_typed_list("/api/users", 200, UserHeader, headers=headers)
    # Then: I get only default user
    assert 1 == len(r)


def test_post_get_put_delete(client: ApiTestClient, headers):
    # POST
    user = User(username="marcin.leliwa@gmail.com", email="marcin.leliwa@gmail.com")
    client.post("/api/users", 200, json=user, headers=headers)

    # GET
    r = client.get_typed(f"/api/users/{user.username}", 200, User, headers=headers)
    assert user.username == r.username

    # PUT
    user.email = "marcin.leliwa2@gmail.com"
    r = client.put(f"/api/users/{user.username}", 200, json=user, headers=headers)
    r = client.get_typed(f"/api/users/{user.username}", 200, User, headers=headers)
    assert user.email == r.email

    # DELETE
    client.delete(f"/api/users/{user.username}", 200, headers=headers)
    client.get(f"/api/users/{user.username}", 404, headers=headers)


def test_change_password(client: ApiTestClient, headers):
    # Given: A stored user
    user = User(username="marcin.leliwa@gmail.com", email="marcin.leliwa@gmail.com", password="test")
    client.post("/api/users", 200, json=user, headers=headers)
    # When: I change password
    response = client.patch(
        f"/api/users/{user.username}/change-password", json={"password": "new_test"}, headers=headers
    )
    # Then: I get 200
    assert response.status_code == 200
    # And: I log in with new password
    response = client.post("/api/login", data={"username": "marcin.leliwa@gmail.com", "password": "new_test"})
    # Then: I get 200
    assert response.status_code == 200


def test_add_user_without_password(client: ApiTestClient, headers):
    # Given: A user without password
    user = User(username="jasio", email="jasio.fasola@wp.pl")
    client.post("/api/users", 200, json=user, headers=headers)
    # When: Log in
    response = client.post("/api/login", data={"username": "jasio", "password": ""})
    # Then: It is forbidden (response 4xx)
    assert 400 <= response.status_code <= 499
