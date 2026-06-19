from app.domains.payments.services import PaymentService

class MockStripeObjectRecursive:
    def to_dict_recursive(self):
        return {"type": "wallet_top_up", "user_id": "123"}

class MockStripeObject:
    def to_dict(self):
        return {"type": "wallet_top_up", "amount": "50.00"}

def test_stripe_metadata_to_dict():
    # 1. None
    assert PaymentService._stripe_metadata_to_dict(None) == {}

    # 2. Plain dict
    assert PaymentService._stripe_metadata_to_dict({"key": "val"}) == {"key": "val"}

    # 3. Object with to_dict_recursive
    obj_recursive = MockStripeObjectRecursive()
    assert PaymentService._stripe_metadata_to_dict(obj_recursive) == {"type": "wallet_top_up", "user_id": "123"}

    # 4. Object with to_dict
    obj_dict = MockStripeObject()
    assert PaymentService._stripe_metadata_to_dict(obj_dict) == {"type": "wallet_top_up", "amount": "50.00"}
