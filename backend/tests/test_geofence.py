from app.services.geofence_service import haversine_distance


def test_haversine_zero_distance():
    d = haversine_distance(6.5244, 3.3792, 6.5244, 3.3792)
    assert d == 0.0


def test_haversine_known_distance():
    # ~1.5km between two Lagos points
    d = haversine_distance(6.5244, 3.3792, 6.5378, 3.3792)
    assert 1400 < d < 1600


def test_on_campus_threshold():
    # 100m away — within 500m radius
    d = haversine_distance(6.5244, 3.3792, 6.5253, 3.3792)
    assert d < 500


def test_off_campus():
    # ~2km away — outside 500m radius
    d = haversine_distance(6.5244, 3.3792, 6.5424, 3.3792)
    assert d > 500
